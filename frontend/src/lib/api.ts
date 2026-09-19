import { ApiResponse, HealthStatus, Product } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json: ApiResponse<HealthStatus> = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/products`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return getFallbackProducts();
    const json: ApiResponse<Product[]> = await res.json();
    return json.data || [];
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
