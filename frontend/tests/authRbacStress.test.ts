import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  canAccessManagerDashboard,
  canDeleteProduct,
  canDeleteOrder,
  canEditCustomer,
  canDeleteCustomer,
  canManageCategories,
  canManageUsers,
  hasPermission,
} from '@/lib/permissions';
import { decodeToken } from '@/lib/auth';

describe('auth & RBAC - Empirical Stress Harness & Security Boundaries', () => {
  beforeAll(() => {
    // Polyfill localStorage for node environment if missing
    if (typeof globalThis.localStorage === 'undefined') {
      const store = new Map<string, string>();
      globalThis.localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
        length: 0,
        key: () => null,
      } as any;
    }
  });

  const createMockJwt = (userId: string, email: string, role: string, expOffsetSec: number = 86400) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        userId,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + expOffsetSec,
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa('mock-sig');
    return `${header}.${payload}.${signature}`;
  };

  describe('1. Mock Credentials & Token Parsing', () => {
    it('generates and decodes Manager JWT with MANAGER role', () => {
      const token = createMockJwt('usr-mgr-01', 'manager@tdt.vn', 'MANAGER');
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe('manager@tdt.vn');
      expect(decoded?.role).toBe('MANAGER');
      expect(canAccessManagerDashboard(decoded?.role)).toBe(true);
    });

    it('generates and decodes Customer JWT with CUSTOMER role', () => {
      const token = createMockJwt('usr-cust-01', 'customer@tdt.vn', 'CUSTOMER');
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe('customer@tdt.vn');
      expect(decoded?.role).toBe('CUSTOMER');
      expect(canAccessManagerDashboard(decoded?.role)).toBe(false);
    });
  });

  describe('2. RouteGuard Decision Matrix Simulation', () => {
    const simulateRouteGuard = (
      token: string | null,
      userRole: string | null,
      allowedRoles: string[] = ['MANAGER']
    ): { allowed: boolean; redirectTo?: string } => {
      if (!token && !userRole) {
        return { allowed: false, redirectTo: '/login?reason=unauthenticated' };
      }

      if (token) {
        const decoded = decodeToken(token);
        const now = Math.floor(Date.now() / 1000);
        if (decoded?.exp && decoded.exp < now) {
          return { allowed: false, redirectTo: '/login?reason=token_expired' };
        }
      }

      const effectiveRole = (userRole || '').toUpperCase();
      if (!effectiveRole) {
        return { allowed: false, redirectTo: '/login?reason=unauthenticated' };
      }

      const hasRole = allowedRoles.some(
        (r) => r.toUpperCase() === effectiveRole
      );

      if (!hasRole) {
        return { allowed: false, redirectTo: '/403' };
      }

      return { allowed: true };
    };

    it('allows MANAGER session into /manager/*', () => {
      const token = createMockJwt('usr-mgr', 'manager@tdt.vn', 'MANAGER');
      const result = simulateRouteGuard(token, 'MANAGER');
      expect(result.allowed).toBe(true);
      expect(result.redirectTo).toBeUndefined();
    });

    it('rejects obsolete ADMIN session attempting /manager/* to /403', () => {
      const token = createMockJwt('usr-adm', 'admin@tdt.vn', 'ADMIN');
      const result = simulateRouteGuard(token, 'ADMIN');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/403');
    });

    it('strictly redirects CUSTOMER session attempting /manager/* to /403', () => {
      const token = createMockJwt('usr-cust', 'customer@tdt.vn', 'CUSTOMER');
      const result = simulateRouteGuard(token, 'CUSTOMER');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/403');
    });

    it('strictly redirects SHIPPER session attempting /manager/* to /403', () => {
      const token = createMockJwt('usr-ship', 'shipper@tdt.vn', 'SHIPPER');
      const result = simulateRouteGuard(token, 'SHIPPER');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/403');
    });

    it('strictly redirects unauthenticated visitor to /login', () => {
      const result = simulateRouteGuard(null, null);
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/login?reason=unauthenticated');
    });

    it('strictly redirects expired session to /login with token_expired', () => {
      const expiredToken = createMockJwt('usr-exp', 'manager@tdt.vn', 'MANAGER', -3600); // 1 hour ago
      const result = simulateRouteGuard(expiredToken, 'MANAGER');
      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe('/login?reason=token_expired');
    });
  });

  describe('3. Consolidated Permissions for MANAGER Role (ADMIN merged into MANAGER)', () => {
    it('MANAGER has full management capabilities', () => {
      expect(canDeleteProduct('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'product:delete')).toBe(true);
      expect(canDeleteOrder('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'order:delete')).toBe(true);
      expect(canEditCustomer('MANAGER')).toBe(true);
      expect(canDeleteCustomer('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'customer:edit')).toBe(true);
      expect(hasPermission('MANAGER', 'customer:delete')).toBe(true);
      expect(canManageCategories('MANAGER')).toBe(true);
      expect(canManageUsers('MANAGER')).toBe(true);
      expect(hasPermission('MANAGER', 'category:manage')).toBe(true);
      expect(hasPermission('MANAGER', 'user:manage')).toBe(true);
    });

    it('CUSTOMER and SHIPPER cannot perform management actions', () => {
      for (const role of ['CUSTOMER', 'SHIPPER']) {
        expect(canDeleteProduct(role)).toBe(false);
        expect(canDeleteOrder(role)).toBe(false);
        expect(canEditCustomer(role)).toBe(false);
        expect(canDeleteCustomer(role)).toBe(false);
        expect(canManageCategories(role)).toBe(false);
        expect(canManageUsers(role)).toBe(false);
      }
    });

    it('obsolete ADMIN role is not recognized for permissions', () => {
      expect(hasPermission('ADMIN', 'product:delete')).toBe(false);
      expect(canDeleteProduct('ADMIN')).toBe(false);
    });
  });
});
