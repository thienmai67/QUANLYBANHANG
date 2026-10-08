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

describe('permissions - RBAC Matrix & Manager Security Guards', () => {
  describe('Manager Dashboard Access Guard', () => {
    it('allows access for MANAGER and ADMIN', () => {
      expect(canAccessManagerDashboard('MANAGER')).toBe(true);
      expect(canAccessManagerDashboard('ADMIN')).toBe(true);
      expect(canAccessManagerDashboard('manager')).toBe(true);
      expect(canAccessManagerDashboard('admin')).toBe(true);
    });

    it('blocks access for non-manager roles and unauthenticated users', () => {
      expect(canAccessManagerDashboard('CUSTOMER')).toBe(false);
      expect(canAccessManagerDashboard('customer')).toBe(false);
      expect(canAccessManagerDashboard('SHIPPER')).toBe(false);
      expect(canAccessManagerDashboard('SALE')).toBe(false);
      expect(canAccessManagerDashboard(undefined)).toBe(false);
      expect(canAccessManagerDashboard(null)).toBe(false);
      expect(canAccessManagerDashboard('')).toBe(false);
    });
  });

  describe('Manager Action Restrictions (Disallowed Actions)', () => {
    it('strictly forbids MANAGER from deleting products', () => {
      expect(canDeleteProduct('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'product:delete')).toBe(false);
    });

    it('strictly forbids MANAGER from deleting orders', () => {
      expect(canDeleteOrder('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'order:delete')).toBe(false);
    });

    it('strictly forbids MANAGER from editing or deleting customers', () => {
      expect(canEditCustomer('MANAGER')).toBe(false);
      expect(canDeleteCustomer('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'customer:edit')).toBe(false);
      expect(hasPermission('MANAGER', 'customer:delete')).toBe(false);
    });

    it('strictly forbids MANAGER from managing product categories or user accounts', () => {
      expect(canManageCategories('MANAGER')).toBe(false);
      expect(canManageUsers('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'category:manage')).toBe(false);
      expect(hasPermission('MANAGER', 'user:manage')).toBe(false);
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

  describe('Admin Full Access Verification', () => {
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

    it('permits ADMIN to execute all system actions without restriction', () => {
      for (const action of allActions) {
        expect(hasPermission('ADMIN', action)).toBe(true);
      }

      expect(canDeleteProduct('ADMIN')).toBe(true);
      expect(canDeleteOrder('ADMIN')).toBe(true);
      expect(canEditCustomer('ADMIN')).toBe(true);
      expect(canDeleteCustomer('ADMIN')).toBe(true);
      expect(canManageCategories('ADMIN')).toBe(true);
      expect(canManageUsers('ADMIN')).toBe(true);
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
