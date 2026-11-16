import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCartStore } from '../src/store/useCartStore';
import { useAuthStore } from '../src/store/useAuthStore';

describe('Cart Authentication Guard Unit Tests', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects adding items when window is present and user is unauthenticated', () => {
    // Simulate browser window environment
    (global as any).window = {};
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null });

    const product = {
      id: 'prod-1',
      name: 'Ống nhựa uPVC D90 Bình Minh',
      sku: 'BM-UPVC-D90',
      unitPrice: 125000,
    };

    useCartStore.getState().addItem(product, 2);

    // Should remain 0 items because unauthenticated
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);

    delete (global as any).window;
  });

  it('allows adding items when window is present and user is authenticated via useAuthStore', () => {
    (global as any).window = {};
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'u1', name: 'Nguyễn Văn A', email: 'a@example.com', role: 'customer' },
      token: 'valid-jwt-token',
    });

    const product = {
      id: 'prod-1',
      name: 'Ống nhựa uPVC D90 Bình Minh',
      sku: 'BM-UPVC-D90',
      unitPrice: 125000,
      quantity: 3,
    };

    useCartStore.getState().addItem(product);

    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
    expect(useCartStore.getState().getTotalItems()).toBe(3);
    expect(useCartStore.getState().getTotalPrice()).toBe(375000);

    delete (global as any).window;
  });

  it('clears cart and total resets to 0', () => {
    (global as any).window = {};
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'u1', name: 'Nguyễn Văn A', email: 'a@example.com', role: 'customer' },
      token: 'valid-jwt-token',
    });

    useCartStore.getState().addItem({
      id: 'prod-2',
      name: 'Xi măng Hà Tiên PCB40',
      sku: 'XM-HT-PCB40',
      unitPrice: 90000,
      quantity: 10,
    });

    expect(useCartStore.getState().items.length).toBe(1);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().getTotalPrice()).toBe(0);

    delete (global as any).window;
  });
});
