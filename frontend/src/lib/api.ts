import { HealthStatus, Product } from "@/types/api";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "@/lib/auth";

function normalizeApiBaseUrl(raw?: string): string {
  const trimmed = (raw ?? "/api").trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/api") {
    return "/api/v1";
  }
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return err.message || "Dữ liệu yêu cầu không hợp lệ";
      case 401:
        return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
      case 403:
        return "Bạn không có quyền thực hiện thao tác này";
      case 409:
        if (err.code === "DUPLICATE_SKU") {
          return err.message || "Mã SKU đã tồn tại trong hệ thống";
        }
        return "Đơn hàng vừa được cập nhật bởi người khác, đã tải lại dữ liệu mới";
      case 404:
        return err.message || "Không tìm thấy dữ liệu yêu cầu";
      case 500:
        return "Lỗi hệ thống máy chủ, vui lòng thử lại sau";
      default:
        return err.message || "Đã xảy ra lỗi, vui lòng thử lại";
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Đã xảy ra lỗi không xác định";
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.accessToken || data.access_token;
    const newRefreshToken = data.refreshToken || data.refresh_token;

    if (newAccessToken) {
      saveTokens(newAccessToken, newRefreshToken || refreshToken);
      try {
        const { useAuthStore } = await import("@/store/useAuthStore");
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken || refreshToken);
      } catch {
        // ignore in non-browser or test context
      }
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

function handleAuthFailure() {
  clearTokens();
  try {
    import("@/store/useAuthStore").then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    });
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function parseApiError(res: Response): Promise<ApiError> {
  let errorData: any = null;
  try {
    errorData = await res.json();
  } catch {
    // body is not json
  }

  const code = errorData?.code;
  const message = errorData?.message || res.statusText || `Request failed with status ${res.status}`;
  return new ApiError(message, res.status, code, errorData);
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isAbsolute = endpoint.startsWith("http://") || endpoint.startsWith("https://");
  const url = isAbsolute
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const currentToken = getAccessToken();
  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept 401: Refresh & retry 1 time
  if (res.status === 401) {
    const isAuthRoute =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/refresh") ||
      endpoint.includes("/auth/register");

    if (!isAuthRoute && typeof window !== "undefined") {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await performTokenRefresh();
        isRefreshing = false;
        onRefreshed(newToken);

        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          const retryRes = await fetch(url, {
            ...options,
            headers,
          });
          if (retryRes.ok) {
            if (retryRes.status === 204) return {} as T;
            return await retryRes.json();
          }
          throw await parseApiError(retryRes);
        } else {
          handleAuthFailure();
          throw await parseApiError(res);
        }
      } else {
        // Wait for ongoing refresh
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh(async (token) => {
            if (!token) {
              reject(
                new ApiError(
                  "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
                  401,
                  "UNAUTHORIZED"
                )
              );
              return;
            }
            try {
              headers.set("Authorization", `Bearer ${token}`);
              const retryRes = await fetch(url, {
                ...options,
                headers,
              });
              if (retryRes.ok) {
                if (retryRes.status === 204) resolve({} as T);
                else resolve(await retryRes.json());
              } else {
                reject(await parseApiError(retryRes));
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    }
  }

  if (!res.ok) {
    throw await parseApiError(res);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return await res.json();
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export const apiClient = api;

export async function fetchHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data as HealthStatus) || (json as HealthStatus);
  } catch {
    return null;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return getFallbackProducts();
    const json = await res.json();
    const data = json.data || json;
    if (Array.isArray(data)) return data as Product[];
    return getFallbackProducts();
  } catch {
    return getFallbackProducts();
  }
}

function getFallbackProducts(): Product[] {
  return [
    {
      id: "p1000000-0000-0000-0000-000000000001",
      sku: "BM-UPVC-D42-C1",
      name: "Ống uPVC Bình Minh Phi 42mm C1 (Cây 4m)",
      brand_name: "Bình Minh",
      discount_rate: 18,
      category_id: "c1000000-0000-0000-0000-000000000001",
      category_name: "Vật tư Nước (Plumbing)",
      base_unit_id: "u1000000-0000-0000-0000-000000000001",
      base_unit_name: "Mét",
      base_price: 21500,
      stock_quantity: 2400,
      diameter_mm: 42,
      conversions: [
        {
          id: "c2000000-0000-0000-0000-000000000001",
          product_id: "p1000000-0000-0000-0000-000000000001",
          from_unit_id: "u1000000-0000-0000-0000-000000000002",
          from_unit_name: "Cây (4m)",
          to_unit_id: "u1000000-0000-0000-0000-000000000001",
          to_unit_name: "Mét",
          conversion_factor: 4,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "p1000000-0000-0000-0000-000000000002",
      sku: "CADIVI-CV-2.5",
      name: "Dây điện đơn ruột đồng Cadivi CV 2.5mm² (Cuộn 100m)",
      brand_name: "Cadivi",
      discount_rate: 22,
      category_id: "c1000000-0000-0000-0000-000000000002",
      category_name: "Dây cáp Điện (Electrical)",
      base_unit_id: "u1000000-0000-0000-0000-000000000001",
      base_unit_name: "Mét",
      base_price: 8900,
      stock_quantity: 5000,
      cross_section_mm2: 2.5,
      amp_rating: 24,
      conversions: [
        {
          id: "c2000000-0000-0000-0000-000000000002",
          product_id: "p1000000-0000-0000-0000-000000000002",
          from_unit_id: "u1000000-0000-0000-0000-000000000003",
          from_unit_name: "Cuộn (100m)",
          to_unit_id: "u1000000-0000-0000-0000-000000000001",
          to_unit_name: "Mét",
          conversion_factor: 100,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "p1000000-0000-0000-0000-000000000003",
      sku: "PANA-MCB-2P32",
      name: "Aptomat chống giật Panasonic RCBO 2P 32A 30mA",
      brand_name: "Panasonic",
      discount_rate: 15,
      category_id: "c1000000-0000-0000-0000-000000000003",
      category_name: "Thiết bị Đóng cắt",
      base_unit_id: "u1000000-0000-0000-0000-000000000004",
      base_unit_name: "Cái",
      base_price: 345000,
      stock_quantity: 150,
      amp_rating: 32,
      conversions: [
        {
          id: "c2000000-0000-0000-0000-000000000003",
          product_id: "p1000000-0000-0000-0000-000000000003",
          from_unit_id: "u1000000-0000-0000-0000-000000000005",
          from_unit_name: "Hộp (6 cái)",
          to_unit_id: "u1000000-0000-0000-0000-000000000004",
          to_unit_name: "Cái",
          conversion_factor: 6,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "p1000000-0000-0000-0000-000000000004",
      sku: "BM-CO90-D42",
      name: "Co 90 độ uPVC Bình Minh Phi 42mm",
      brand_name: "Bình Minh",
      discount_rate: 18,
      category_id: "c1000000-0000-0000-0000-000000000001",
      category_name: "Phụ kiện Ống Nước",
      base_unit_id: "u1000000-0000-0000-0000-000000000004",
      base_unit_name: "Cái",
      base_price: 14500,
      stock_quantity: 1200,
      diameter_mm: 42,
      conversions: [
        {
          id: "c2000000-0000-0000-0000-000000000004",
          product_id: "p1000000-0000-0000-0000-000000000004",
          from_unit_id: "u1000000-0000-0000-0000-000000000006",
          from_unit_name: "Bao (50 cái)",
          to_unit_id: "u1000000-0000-0000-0000-000000000004",
          to_unit_name: "Cái",
          conversion_factor: 50,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
