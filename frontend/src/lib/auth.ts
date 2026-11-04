export type AuthUser = {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
};

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  try {
    if (typeof document !== "undefined") {
      const decoded = decodeToken(accessToken);
      const maxAge = decoded ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 86400;
      document.cookie = `access_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
      if (decoded?.role) {
        document.cookie = `user_role=${decoded.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    }
  } catch {
    // ignore cookie writing errors
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export const getToken = getAccessToken;

export function getRefreshToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  try {
    if (typeof document !== "undefined") {
      document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
    }
  } catch {
    // ignore cookie deletion errors
  }
}

export const removeTokens = clearTokens;

export function syncAuthCookies(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const token = getAccessToken();
  if (token && !isExpired(token)) {
    const decoded = decodeToken(token);
    const maxAge = decoded ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 86400;
    document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (decoded?.role) {
      document.cookie = `user_role=${decoded.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  }
}

export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as AuthUser;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const decoded = decodeToken(token);
  return !decoded || decoded.exp * 1000 < Date.now();
}

export function getCurrentUser(): AuthUser | null {
  const token = getAccessToken();
  if (!token || isExpired(token)) return null;
  return decodeToken(token);
}

export function logout(): void {
  clearTokens();
  try {
    const { useCartStore } = require('@/store/useCartStore');
    useCartStore.getState().clearCart();
  } catch {
    // ignore
  }
  window.location.href = "/";
}
