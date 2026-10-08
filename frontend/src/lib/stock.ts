import { OrderItem, Product, StockLog, OrderStatus } from '@/types/manager';

export interface MissingStockItem {
  productId: string;
  productName: string;
  requested: number;
  currentStock: number;
}

export interface StockAvailabilityResult {
  available: boolean;
  missingItems: MissingStockItem[];
}

/**
 * Helper to safely extract current stock from a product object
 * supporting both stockQuantity and legacy stock property
 */
export function getProductStock(product?: Product | { stockQuantity?: number; stock?: number }): number {
  if (!product) return 0;
  if (typeof (product as any).stockQuantity === 'number') {
    return (product as any).stockQuantity;
  }
  if (typeof (product as any).stock === 'number') {
    return (product as any).stock;
  }
  return 0;
}

/**
 * Checks whether all requested items in an order are sufficiently stocked.
 * Pure and immutable.
 */
export function checkStockAvailability(
  itemsOrOrder: OrderItem[] | { items: OrderItem[] },
  products: Product[]
): StockAvailabilityResult {
  const items: OrderItem[] = Array.isArray(itemsOrOrder)
    ? itemsOrOrder
    : itemsOrOrder && Array.isArray((itemsOrOrder as any).items)
    ? (itemsOrOrder as any).items
    : [];

  const productMap = new Map<string, Product>();
  for (const prod of products) {
    productMap.set(prod.id, prod);
  }

  const missingItems: MissingStockItem[] = [];

  for (const item of items) {
    const prod = productMap.get(item.productId);
    const currentStock = getProductStock(prod);

    if (currentStock < item.quantity) {
      missingItems.push({
        productId: item.productId,
        productName: item.productName || prod?.name || item.productId,
        requested: item.quantity,
        currentStock,
      });
    }
  }

  return {
    available: missingItems.length === 0,
    missingItems,
  };
}

// Alias for survey/tests compatibility
export const verifyStockAvailability = checkStockAvailability;

/**
 * Atomically and immutably deducts stock for an approved order.
 * Generates corresponding audit StockLog entries.
 * Throws an Error if any product is missing or has insufficient stock.
 */
export function deductStockForOrder(
  itemsOrOrder: OrderItem[] | { id: string; items: OrderItem[] },
  products: Product[],
  orderIdParam?: string,
  managerNameParam: string = 'Manager'
): { updatedProducts: Product[]; logs: StockLog[] } {
  const isOrderObj = !Array.isArray(itemsOrOrder) && typeof (itemsOrOrder as any)?.id === 'string';
  const items: OrderItem[] = isOrderObj
    ? (itemsOrOrder as any).items
    : (itemsOrOrder as OrderItem[]);
  const orderId = isOrderObj ? (itemsOrOrder as any).id : orderIdParam || 'UNKNOWN_ORDER';
  const managerName = isOrderObj && typeof orderIdParam === 'string' ? orderIdParam : managerNameParam;

  // Pre-check availability
  const check = checkStockAvailability(items, products);
  if (!check.available) {
    const firstMissing = check.missingItems[0];
    throw new Error(
      `Không đủ tồn kho cho sản phẩm ${firstMissing.productName} (Yêu cầu: ${firstMissing.requested}, Hiện có: ${firstMissing.currentStock})`
    );
  }

  // Create immutable clones
  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, { ...p });
  }

  const logs: StockLog[] = [];
  const now = new Date().toISOString();

  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) continue;

    const previousStock = getProductStock(prod);
    const newStock = previousStock - item.quantity;

    // Update both property names for safety
    prod.stockQuantity = newStock;
    (prod as any).stock = newStock;

    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: prod.id,
      productName: prod.name,
      changeAmount: -item.quantity,
      previousStock,
      newStock,
      type: 'ORDER_APPROVED',
      referenceId: orderId,
      createdAt: now,
      createdByName: managerName,
    });
  }

  return {
    updatedProducts: Array.from(productMap.values()),
    logs,
  };
}

/**
 * Restocks inventory when an approved order is cancelled.
 * CRITICAL INVARIANT:
 * If the cancelled order was never approved (i.e. cancelled directly from PENDING),
 * stock was never deducted, so NO stock should be added back!
 */
export function restockForOrder(
  itemsOrOrder: OrderItem[] | { id: string; status?: OrderStatus; items: OrderItem[] },
  products: Product[],
  orderIdParam?: string,
  managerNameParam: string = 'Manager',
  previousStatusParam?: OrderStatus
): { updatedProducts: Product[]; logs: StockLog[] } {
  const isOrderObj = !Array.isArray(itemsOrOrder) && typeof (itemsOrOrder as any)?.id === 'string';
  const orderObj = isOrderObj ? (itemsOrOrder as any) : null;
  const items: OrderItem[] = isOrderObj ? orderObj.items : (itemsOrOrder as OrderItem[]);
  const orderId = isOrderObj ? orderObj.id : orderIdParam || 'UNKNOWN_ORDER';
  const managerName = isOrderObj && typeof orderIdParam === 'string' ? orderIdParam : managerNameParam;

  // Check if stock was previously deducted:
  // If order object provided and status is PENDING, or previousStatus was PENDING -> do not restock!
  const status = orderObj ? orderObj.status : previousStatusParam;
  if (status === 'PENDING') {
    // Order was never deducted; return products unchanged with no logs
    return {
      updatedProducts: products.map((p) => ({ ...p })),
      logs: [],
    };
  }

  const productMap = new Map<string, Product>();
  for (const p of products) {
    productMap.set(p.id, { ...p });
  }

  const logs: StockLog[] = [];
  const now = new Date().toISOString();

  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) continue;

    const previousStock = getProductStock(prod);
    const newStock = previousStock + item.quantity;

    prod.stockQuantity = newStock;
    (prod as any).stock = newStock;

    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: prod.id,
      productName: prod.name,
      changeAmount: item.quantity,
      previousStock,
      newStock,
      type: 'ORDER_CANCELLED',
      referenceId: orderId,
      createdAt: now,
      createdByName: managerName,
    });
  }

  return {
    updatedProducts: Array.from(productMap.values()),
    logs,
  };
}

/**
 * Calculates discounted price for a product, returning integer VND
 */
export function calculateDiscountedPrice(basePrice: number, discountPercent: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  if (!discountPercent || discountPercent <= 0) return Math.round(basePrice);
  const factor = Math.max(0, 1 - discountPercent / 100);
  return Math.round(basePrice * factor);
}
