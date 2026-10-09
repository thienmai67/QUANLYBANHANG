import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useManagerStore } from '../src/store/useManagerStore';
import { api, ApiError } from '../src/lib/api';
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from '../src/lib/auth';
import { useAuthStore } from '../src/store/useAuthStore';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, String(v)),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
};
// @ts-ignore
globalThis.localStorage = localStorageMock;
// @ts-ignore
globalThis.window = { localStorage: localStorageMock };

describe('Hardening Integration & Security Test Suite', () => {
  beforeEach(() => {
    storage.clear();
    useManagerStore.getState().resetToSeedData();
    clearTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearTokens();
    storage.clear();
  });

  describe('1. 409 Conflict: Optimistic Locking & Server Refresh', () => {
    it('catches 409 Conflict, triggers fetchOrders, returns conflict error message, and rolls back optimistic changes', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;
      expect(pendingOrder).toBeDefined();

      const initialProducts = [...useManagerStore.getState().products];
      const initialLogs = [...useManagerStore.getState().stockLogs];

      // Spy on fetchOrders
      const fetchSpy = vi.spyOn(useManagerStore.getState(), 'fetchOrders').mockImplementation(async () => {});

      // Mock api.patch to throw 409 Conflict
      const patchSpy = vi.spyOn(api, 'patch').mockRejectedValue(
        new ApiError('Xung đột phiên bản dữ liệu', 409, 'VERSION_CONFLICT')
      );

      const result = await useManagerStore.getState().approveOrder(pendingOrder.id, 'Manager Hải Đăng');

      // 0. Verified version sent in PATCH payload
      expect(patchSpy).toHaveBeenCalledWith(
        `/orders/${pendingOrder.id}/status`,
        expect.objectContaining({
          status: 'PACKING',
          version: pendingOrder.version,
        })
      );

      // 1. Mutation failed
      expect(result.success).toBe(false);
      expect(result.error).toContain('Đơn hàng vừa được cập nhật bởi người khác, đã tải lại dữ liệu mới');

      // 2. Triggered fetchOrders to re-sync
      expect(fetchSpy).toHaveBeenCalled();

      // 3. Optimistic state rolled back to original
      const revertedOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id)!;
      expect(revertedOrder.status).toBe('PENDING');
      expect(revertedOrder.version).toBe(pendingOrder.version);

      // 4. Stock and logs rolled back
      expect(useManagerStore.getState().products).toEqual(initialProducts);
      expect(useManagerStore.getState().stockLogs).toEqual(initialLogs);
    });
  });

  describe('2. 401 Refresh Rotation: Auto Refresh and Single Retry', () => {
    it('intercepts 401, refreshes tokens via /auth/refresh, saves new tokens, and retries request successfully', async () => {
      saveTokens('stale-access-token', 'valid-refresh-token');

      let callCount = 0;
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        callCount++;

        // First call: GET /orders -> returns 401
        if (callCount === 1 && String(url).includes('/orders')) {
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            headers: new Headers(),
            json: async () => ({ code: 'UNAUTHORIZED', message: 'Token expired' }),
          } as any;
        }

        // Second call: POST /auth/refresh with refreshToken -> returns 200 with new token pair
        if (String(url).includes('/auth/refresh')) {
          const body = JSON.parse((init?.body as string) || '{}');
          expect(body.refreshToken).toBe('valid-refresh-token');
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({
              accessToken: 'new-rotated-access-token',
              refreshToken: 'new-rotated-refresh-token',
              expiresIn: 7200,
            }),
          } as any;
        }

        // Third call: Retried GET /orders with new Authorization header -> returns 200
        if (callCount === 3 && String(url).includes('/orders')) {
          const authHeader = (init?.headers as Headers).get('Authorization');
          expect(authHeader).toBe('Bearer new-rotated-access-token');
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => [{ id: 'order-live-1', status: 'PENDING' }],
          } as any;
        }

        return {
          ok: false,
          status: 500,
          headers: new Headers(),
          json: async () => ({ message: 'Unexpected call' }),
        } as any;
      });

      try {
        const data = await api.get('/orders');
        expect(data).toEqual([{ id: 'order-live-1', status: 'PENDING' }]);

        // Tokens rotated and saved
        expect(getAccessToken()).toBe('new-rotated-access-token');
        expect(getRefreshToken()).toBe('new-rotated-refresh-token');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('3. 401 Refresh Failure: Clears Tokens & Triggers Logout', () => {
    it('clears credentials when /auth/refresh fails with 401', async () => {
      saveTokens('stale-access-token', 'corrupted-refresh-token');

      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        // Any request returns 401
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          json: async () => ({ code: 'UNAUTHORIZED', message: 'Token invalid' }),
        } as any;
      });

      try {
        await expect(api.get('/orders')).rejects.toThrow();

        // Credentials must be cleared
        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('4. orderRules: Fail-Fast Client Pre-checks (Blocks API calls)', () => {
    it('blocks invalid status transition from PENDING to DELIVERED before calling API', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;

      const patchSpy = vi.spyOn(api, 'patch');

      const result = await useManagerStore.getState().updateOrderStatusWithActor(
        pendingOrder.id,
        'DELIVERED',
        { role: 'MANAGER' }
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
      expect(result.error).toContain('Đơn đã thay đổi trạng thái');

      // Invariant: Server API was NEVER called
      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('blocks cancellation with reason < 5 characters before calling API', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;

      const patchSpy = vi.spyOn(api, 'patch');

      const result = await useManagerStore.getState().cancelOrder(
        pendingOrder.id,
        'Huy'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('ít nhất 5 ký tự');

      // Invariant: Server API was NEVER called
      expect(patchSpy).not.toHaveBeenCalled();
    });

    it('blocks transition from PACKING to SHIPPING without shipper before calling API', async () => {
      const store = useManagerStore.getState();
      const pendingOrder = store.orders.find((o) => o.status === 'PENDING')!;

      // Mock api.patch for approval
      vi.spyOn(api, 'patch').mockResolvedValue({
        id: pendingOrder.id,
        status: 'PACKING',
        version: 2,
      } as any);

      await store.approveOrder(pendingOrder.id);

      const packingOrder = useManagerStore.getState().orders.find((o) => o.id === pendingOrder.id)!;
      expect(packingOrder.status).toBe('PACKING');
      expect(packingOrder.shipperId).toBeUndefined();

      const patchSpy = vi.spyOn(api, 'patch');
      patchSpy.mockClear();

      // Attempt transition to SHIPPING directly without assigning shipper
      const result = await useManagerStore.getState().updateOrderStatusWithActor(
        packingOrder.id,
        'SHIPPING',
        { role: 'MANAGER' }
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MISSING_SHIPPER');
      expect(result.error).toContain('Chưa phân công shipper');

      // Invariant: Server API was NEVER called
      expect(patchSpy).not.toHaveBeenCalled();
    });
  });
});
