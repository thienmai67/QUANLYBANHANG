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
      allowedRoles: string[] = ['MANAGER', 'ADMIN']
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
        (r) => r.toUpperCase() === effectiveRole || effectiveRole === 'ADMIN'
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

    it('allows ADMIN session into /manager/*', () => {
      const token = createMockJwt('usr-adm', 'admin@tdt.vn', 'ADMIN');
      const result = simulateRouteGuard(token, 'ADMIN');
      expect(result.allowed).toBe(true);
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

  describe('3. Strict Disallowed Actions for MANAGER Role', () => {
    it('MANAGER cannot delete products', () => {
      expect(canDeleteProduct('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'product:delete')).toBe(false);
    });

    it('MANAGER cannot delete orders', () => {
      expect(canDeleteOrder('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'order:delete')).toBe(false);
    });

    it('MANAGER cannot edit or delete customers', () => {
      expect(canEditCustomer('MANAGER')).toBe(false);
      expect(canDeleteCustomer('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'customer:edit')).toBe(false);
      expect(hasPermission('MANAGER', 'customer:delete')).toBe(false);
    });

    it('MANAGER cannot manage categories or users', () => {
      expect(canManageCategories('MANAGER')).toBe(false);
      expect(canManageUsers('MANAGER')).toBe(false);
      expect(hasPermission('MANAGER', 'category:manage')).toBe(false);
      expect(hasPermission('MANAGER', 'user:manage')).toBe(false);
    });
  });
});
