export type UserRole = 'ADMIN' | 'MANAGER' | 'CUSTOMER' | 'SHIPPER' | 'SALE';

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
  if (upper === 'ADMIN' || upper === 'MANAGER' || upper === 'CUSTOMER' || upper === 'SHIPPER' || upper === 'SALE') {
    return upper as UserRole;
  }
  return null;
}

/**
 * Evaluates whether a role has permission for a specific action.
 * Enforces strict restrictions: MANAGER CANNOT delete product, order, customer,
 * CANNOT edit customer, and CANNOT manage categories or users.
 * SHIPPER only has view-own-orders, order:pickup, order:deliver, order:report-incident, shift:update, cod:view, cod:settle.
 */
export function hasPermission(role?: string | null, action?: ActionKey): boolean {
  if (!role || !action) return false;
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  // ADMIN has full rights
  if (normalized === 'ADMIN') {
    return true;
  }

  // MANAGER permissions matrix
  if (normalized === 'MANAGER') {
    switch (action) {
      case 'dashboard:view':
      case 'order:view':
      case 'order:approve':
      case 'order:assign_shipper':
      case 'order:cancel':
      case 'product:view':
      case 'product:create':
      case 'product:adjust_stock':
      case 'customer:view':
      case 'customer:create':
        return true;

      // Disallowed actions for MANAGER
      case 'order:delete':
      case 'product:delete':
      case 'customer:edit':
      case 'customer:delete':
      case 'category:manage':
      case 'user:manage':
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

  // Other roles do not have manager/admin/shipper actions
  return false;
}

/**
 * Alias helper function for checking role permissions cleanly in UI
 */
export function can(role?: string | null, action?: ActionKey): boolean {
  return hasPermission(role, action);
}

/**
 * Guard: Only MANAGER and ADMIN can access Manager Dashboard
 */
export function canAccessManagerDashboard(role?: string | null): boolean {
  const norm = normalizeRole(role ?? undefined);
  return norm === 'ADMIN' || norm === 'MANAGER';
}

/**
 * Guard: Only SHIPPER and ADMIN can access Shipper Portal
 */
export function canAccessShipperPortal(role?: string | null): boolean {
  const norm = normalizeRole(role ?? undefined);
  return norm === 'ADMIN' || norm === 'SHIPPER';
}

/**
 * Guard: MANAGER cannot delete products (ADMIN only)
 */
export function canDeleteProduct(role?: string | null): boolean {
  return hasPermission(role, 'product:delete');
}

/**
 * Guard: MANAGER cannot delete orders (ADMIN only)
 */
export function canDeleteOrder(role?: string | null): boolean {
  return hasPermission(role, 'order:delete');
}

/**
 * Guard: MANAGER cannot edit customers (ADMIN only)
 */
export function canEditCustomer(role?: string | null): boolean {
  return hasPermission(role, 'customer:edit');
}

/**
 * Guard: MANAGER cannot delete customers (ADMIN only)
 */
export function canDeleteCustomer(role?: string | null): boolean {
  return hasPermission(role, 'customer:delete');
}

/**
 * Guard: MANAGER cannot manage categories (ADMIN only)
 */
export function canManageCategories(role?: string | null): boolean {
  return hasPermission(role, 'category:manage');
}

/**
 * Guard: MANAGER cannot manage user accounts (ADMIN only)
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
