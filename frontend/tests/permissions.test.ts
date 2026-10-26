import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canAccessManagerDashboard,
  canDeleteProduct,
  canDeleteOrder,
  canEditCustomer,
  canDeleteCustomer,
  canManageCategories,
  canManageUsers,
  canCreateProduct,
  canAdjustStock,
  canApproveOrder,
  canCancelOrder,
  canAssignShipperAction,
  ActionKey,
} from '@/lib/permissions';

describe('permissions - RBAC Matrix & Manager Consolidated Security Guards', () => {
  describe('Manager Dashboard Access Guard', () => {
    it('allows access for MANAGER', () => {
      expect(canAccessManagerDashboard('MANAGER')).toBe(true);
      expect(canAccessManagerDashboard('manager')).toBe(true);
    });

    it('blocks access for deprecated ADMIN, non-manager roles and unauthenticated users', () => {
      expect(canAccessManagerDashboard('ADMIN')).toBe(false);
      expect(canAccessManagerDashboard('admin')).toBe(false);
      expect(canAccessManagerDashboard('CUSTOMER')).toBe(false);
      expect(canAccessManagerDashboard('customer')).toBe(false);
      expect(canAccessManagerDashboard('SHIPPER')).toBe(false);
      expect(canAccessManagerDashboard('SALE')).toBe(false);
      expect(canAccessManagerDashboard(undefined)).toBe(false);
      expect(canAccessManagerDashboard(null)).toBe(false);
      expect(canAccessManagerDashboard('')).toBe(false);
    });
  });

  describe('Manager Inherited Management Actions (Consolidated Admin + Manager)', () => {
    it('allows MANAGER to delete products and orders', () => {
      expect(canDeleteProduct('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'product:delete')).toBe(true);
      expect(canDeleteOrder('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'order:delete')).toBe(true);
    });

    it('allows MANAGER to edit and delete customers', () => {
      expect(canEditCustomer('MANAGER')).toBe(true);
      expect(canDeleteCustomer('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'customer:edit')).toBe(true);
      expect(hasPermission('MANAGER', 'customer:delete')).toBe(true);
    });

    it('allows MANAGER to manage product categories and user accounts', () => {
      expect(canManageCategories('MANAGER')).toBe(true);
      expect(canManageUsers('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'category:manage')).toBe(true);
      expect(hasPermission('MANAGER', 'user:manage')).toBe(true);
    });
  });

  describe('Manager Allowed Operational Actions', () => {
    it('allows MANAGER to view and approve orders', () => {
      expect(canApproveOrder('MANAGER')).toBe(true);
      expect(canCancelOrder('MANAGER')).toBe(true);
      expect(canAssignShipperAction('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'order:view')).toBe(true);
    });

    it('allows MANAGER to create products and adjust warehouse stock', () => {
      expect(canCreateProduct('MANAGER')).toBe(true);
      expect(canAdjustStock('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'product:view')).toBe(true);
    });

    it('allows MANAGER to view customers and create retail customers', () => {
      expect(hasPermission('MANAGER', 'customer:view')).toBe(true);
      expect(hasPermission('MANAGER', 'customer:create')).toBe(true);
    });

    it('allows MANAGER to view operational dashboard', () => {
      expect(hasPermission('MANAGER', 'dashboard:view')).toBe(true);
    });
  });

  describe('Deprecated Admin Role Boundary Verification', () => {
    const allActions: ActionKey[] = [
      'dashboard:view',
      'order:view',
      'order:approve',
      'order:assign_shipper',
      'order:cancel',
      'order:delete',
      'product:view',
      'product:create',
      'product:adjust_stock',
      'product:delete',
      'customer:view',
      'customer:create',
      'customer:edit',
      'customer:delete',
      'category:manage',
      'user:manage',
    ];

    it('denies deprecated ADMIN role on all system actions', () => {
      for (const action of allActions) {
        expect(hasPermission('ADMIN', action)).toBe(false);
      }

      expect(canDeleteProduct('ADMIN')).toBe(false);
      expect(canDeleteOrder('ADMIN')).toBe(false);
      expect(canEditCustomer('ADMIN')).toBe(false);
      expect(canDeleteCustomer('ADMIN')).toBe(false);
      expect(canManageCategories('ADMIN')).toBe(false);
      expect(canManageUsers('ADMIN')).toBe(false);
    });
  });

  describe('Customer and Shipper Negative Boundaries', () => {
    it('blocks CUSTOMER from all management actions', () => {
      expect(canApproveOrder('CUSTOMER')).toBe(false);
      expect(canCreateProduct('CUSTOMER')).toBe(false);
      expect(canAdjustStock('CUSTOMER')).toBe(false);
      expect(canDeleteProduct('CUSTOMER')).toBe(false);
      expect(hasPermission('CUSTOMER', 'order:view')).toBe(false);
    });

    it('blocks SHIPPER from administrative and warehouse actions', () => {
      expect(canApproveOrder('SHIPPER')).toBe(false);
      expect(canAdjustStock('SHIPPER')).toBe(false);
      expect(canDeleteProduct('SHIPPER')).toBe(false);
      expect(canDeleteOrder('SHIPPER')).toBe(false);
    });
  });
});
