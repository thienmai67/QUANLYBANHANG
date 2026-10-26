export type UserRole = 'MANAGER' | 'CUSTOMER' | 'SHIPPER' | 'SALE';

export type ActionKey =
  | 'order:view'
  | 'order:approve'
  | 'order:assign_shipper'
  | 'order:cancel'
  | 'order:delete'
  | 'product:view'
  | 'product:create'
  | 'product:adjust_stock'
  | 'product:delete'
  | 'customer:view'
  | 'customer:create'
  | 'customer:edit'
  | 'customer:delete'
  | 'category:manage'
  | 'user:manage'
  | 'dashboard:view'
  // Shipper-specific actions
  | 'view-own-orders'
  | 'order:pickup'
  | 'order:deliver'
  | 'order:report-incident'
  | 'shift:update'
  | 'cod:view'
  | 'cod:settle';

/**
 * Normalizes role string to standard uppercase Role
 */
function normalizeRole(role?: string): UserRole | null {
  if (!role) return null;
  const upper = role.trim().toUpperCase();
  if (upper === 'MANAGER' || upper === 'CUSTOMER' || upper === 'SHIPPER' || upper === 'SALE') {
    return upper as UserRole;
  }
  return null;
}

/**
 * Evaluates whether a role has permission for a specific action.
 * MANAGER has full management permissions (consolidated from ADMIN + MANAGER).
 * SHIPPER only has view-own-orders, order:pickup, order:deliver, order:report-incident, shift:update, cod:view, cod:settle.
 */
export function hasPermission(role?: string | null, action?: ActionKey): boolean {
  if (!role || !action) return false;
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  // MANAGER permissions matrix (Consolidated Admin + Manager)
  if (normalized === 'MANAGER') {
    switch (action) {
      case 'dashboard:view':
      case 'order:view':
      case 'order:approve':
      case 'order:assign_shipper':
      case 'order:cancel':
      case 'order:delete':
      case 'product:view':
      case 'product:create':
      case 'product:adjust_stock':
      case 'product:delete':
      case 'customer:view':
      case 'customer:create':
      case 'customer:edit':
      case 'customer:delete':
      case 'category:manage':
      case 'user:manage':
        return true;
      default:
        return false;
    }
  }

  // SHIPPER permissions matrix
  if (normalized === 'SHIPPER') {
    switch (action) {
      case 'view-own-orders':
      case 'order:pickup':
      case 'order:deliver':
      case 'order:report-incident':
      case 'shift:update':
      case 'cod:view':
      case 'cod:settle':
        return true;
      default:
        return false;
    }
  }

  // Other roles do not have manager/shipper actions
  return false;
}

/**
 * Alias helper function for checking role permissions cleanly in UI
 */
export function can(role?: string | null, action?: ActionKey): boolean {
  return hasPermission(role, action);
}

/**
 * Guard: Only MANAGER can access Manager Dashboard
 */
export function canAccessManagerDashboard(role?: string | null): boolean {
  const norm = normalizeRole(role ?? undefined);
  return norm === 'MANAGER';
}

/**
 * Guard: Only SHIPPER can access Shipper Portal
 */
export function canAccessShipperPortal(role?: string | null): boolean {
  const norm = normalizeRole(role ?? undefined);
  return norm === 'SHIPPER';
}

/**
 * Guard: Can delete products (MANAGER)
 */
export function canDeleteProduct(role?: string | null): boolean {
  return hasPermission(role, 'product:delete');
}

/**
 * Guard: Can delete orders (MANAGER)
 */
export function canDeleteOrder(role?: string | null): boolean {
  return hasPermission(role, 'order:delete');
}

/**
 * Guard: Can edit customers (MANAGER)
 */
export function canEditCustomer(role?: string | null): boolean {
  return hasPermission(role, 'customer:edit');
}

/**
 * Guard: Can delete customers (MANAGER)
 */
export function canDeleteCustomer(role?: string | null): boolean {
  return hasPermission(role, 'customer:delete');
}

/**
 * Guard: Can manage categories (MANAGER)
 */
export function canManageCategories(role?: string | null): boolean {
  return hasPermission(role, 'category:manage');
}

/**
 * Guard: Can manage user accounts (MANAGER)
 */
export function canManageUsers(role?: string | null): boolean {
  return hasPermission(role, 'user:manage');
}

/**
 * Guard: Can create products
 */
export function canCreateProduct(role?: string | null): boolean {
  return hasPermission(role, 'product:create');
}

/**
 * Guard: Can adjust warehouse stock
 */
export function canAdjustStock(role?: string | null): boolean {
  return hasPermission(role, 'product:adjust_stock');
}

/**
 * Guard: Can approve orders
 */
export function canApproveOrder(role?: string | null): boolean {
  return hasPermission(role, 'order:approve');
}

/**
 * Guard: Can cancel orders
 */
export function canCancelOrder(role?: string | null): boolean {
  return hasPermission(role, 'order:cancel');
}

/**
 * Guard: Can assign shipper
 */
export function canAssignShipperAction(role?: string | null): boolean {
  return hasPermission(role, 'order:assign_shipper');
}
