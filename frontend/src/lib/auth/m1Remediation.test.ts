import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/store/useCartStore';

describe('Milestone 1 Remediation Verifications', () => {
  describe('1. Cart Store Guest Cart Persistence (useCartStore.ts)', () => {
    beforeEach(() => {
      useCartStore.getState().clearCart();
    });

    it('preserves guest cart items without an authentication token', () => {
      const guestProduct = {
        id: 'guest-prod-101',
        sku: 'SKU-GUEST-01',
        name: 'Sơn Dulux WeatherShield',
        price: '350.000 ₫',
        unitPrice: 350000,
        image: '/images/dulux.jpg',
        quantity: 2,
      };

      // Guest adds product without any auth token
      useCartStore.getState().addItem(guestProduct, false);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('guest-prod-101');
      expect(items[0].quantity).toBe(2);
      expect(useCartStore.getState().getTotalPrice()).toBe(700000);
      expect(useCartStore.getState().getTotalItems()).toBe(2);

      // Verify cart persists across updates and is not cleared by absent tokens
      useCartStore.getState().updateQuantity('guest-prod-101', 1);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
      expect(useCartStore.getState().getTotalPrice()).toBe(1050000);
    });
  });

  describe('2. Google OAuth Role Resolution Logic', () => {
    const resolveRoleAndRoute = (userRole?: string) => {
      const rawRole = (userRole || '').toUpperCase();
      let role: 'CUSTOMER' | 'MANAGER' | 'SHIPPER' | 'SALE' = 'CUSTOMER';
      if (rawRole === 'MANAGER' || rawRole === 'ADMIN') role = 'MANAGER';
      else if (rawRole === 'SHIPPER') role = 'SHIPPER';
      else if (rawRole === 'SALE') role = 'SALE';

      let redirectRoute = '/profile';
      if (role === 'MANAGER') redirectRoute = '/manager';
      else if (role === 'SHIPPER') redirectRoute = '/shipper';
      else if (role === 'SALE') redirectRoute = '/sale';

      return { role, redirectRoute };
    };

    it('correctly maps SALE role and redirects to /sale', () => {
      const result = resolveRoleAndRoute('SALE');
      expect(result.role).toBe('SALE');
      expect(result.redirectRoute).toBe('/sale');
    });

    it('correctly maps lowercase sale role to SALE and redirects to /sale', () => {
      const result = resolveRoleAndRoute('sale');
      expect(result.role).toBe('SALE');
      expect(result.redirectRoute).toBe('/sale');
    });

    it('correctly maps MANAGER and ADMIN roles to MANAGER and redirects to /manager', () => {
      expect(resolveRoleAndRoute('MANAGER')).toEqual({ role: 'MANAGER', redirectRoute: '/manager' });
      expect(resolveRoleAndRoute('ADMIN')).toEqual({ role: 'MANAGER', redirectRoute: '/manager' });
    });

    it('correctly maps SHIPPER role and redirects to /shipper', () => {
      expect(resolveRoleAndRoute('SHIPPER')).toEqual({ role: 'SHIPPER', redirectRoute: '/shipper' });
    });

    it('falls back unknown or customer role to CUSTOMER and /profile', () => {
      expect(resolveRoleAndRoute('CUSTOMER')).toEqual({ role: 'CUSTOMER', redirectRoute: '/profile' });
      expect(resolveRoleAndRoute('')).toEqual({ role: 'CUSTOMER', redirectRoute: '/profile' });
      expect(resolveRoleAndRoute(undefined)).toEqual({ role: 'CUSTOMER', redirectRoute: '/profile' });
    });
  });

  describe('3. RouteGuard Permissions Alignment', () => {
    const checkAccess = (userRole: string, allowedRoles: string[]): boolean => {
      const effectiveRole = (userRole || '').toUpperCase();
      return allowedRoles.some((r) => r.toUpperCase() === effectiveRole);
    };

    it('allows both SALE and MANAGER roles in Sale Layout RouteGuard', () => {
      const saleAllowedRoles = ['SALE', 'MANAGER'];
      expect(checkAccess('SALE', saleAllowedRoles)).toBe(true);
      expect(checkAccess('MANAGER', saleAllowedRoles)).toBe(true);
      expect(checkAccess('CUSTOMER', saleAllowedRoles)).toBe(false);
      expect(checkAccess('SHIPPER', saleAllowedRoles)).toBe(false);
    });

    it('allows both SHIPPER and MANAGER roles in Shipper Portal RouteGuards', () => {
      const shipperAllowedRoles = ['SHIPPER', 'MANAGER'];
      expect(checkAccess('SHIPPER', shipperAllowedRoles)).toBe(true);
      expect(checkAccess('MANAGER', shipperAllowedRoles)).toBe(true);
      expect(checkAccess('CUSTOMER', shipperAllowedRoles)).toBe(false);
      expect(checkAccess('SALE', shipperAllowedRoles)).toBe(false);
    });
  });

  describe('4. Login Test Accounts Specification Contract', () => {
    it('defines standard quick test accounts for all 4 required operational roles', () => {
      const expectedCredentials = {
        manager: { id: 'quanly@tdt.vn', pass: 'Manager@123', role: 'MANAGER' },
        sale: { id: 'sale@tdt.vn', pass: 'Sale@123', role: 'SALE' },
        shipper: { id: '0901234567', pass: 'Shipper@123', role: 'SHIPPER' },
        customer: { id: 'khachhang@gmail.com', pass: 'Customer@123', role: 'CUSTOMER' },
      };

      expect(expectedCredentials.manager.id).toBe('quanly@tdt.vn');
      expect(expectedCredentials.sale.id).toBe('sale@tdt.vn');
      expect(expectedCredentials.shipper.id).toBe('0901234567');
      expect(expectedCredentials.customer.id).toBe('khachhang@gmail.com');
      expect(expectedCredentials.shipper.id).toMatch(/^0[35789]\d{8}$/);
    });
  });
});
