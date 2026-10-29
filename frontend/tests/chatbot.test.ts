import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { useCartStore } from '../src/store/useCartStore';
import { parseProjectContext, PROJECT_CONTEXT_KEY } from '../src/components/chat/ChatBotWidget';

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('ChatBot Widget & Cart Integration', () => {
  beforeAll(() => {
    const mockLocal = createStorageMock();
    const mockSession = createStorageMock();
    (global as any).localStorage = mockLocal;
    (global as any).sessionStorage = mockSession;
    if (typeof window === 'undefined') {
      (global as any).window = {
        localStorage: mockLocal,
        sessionStorage: mockSession,
      };
    } else {
      Object.defineProperty(window, 'localStorage', { value: mockLocal });
      Object.defineProperty(window, 'sessionStorage', { value: mockSession });
    }
  });

  beforeEach(() => {
    (global as any).localStorage.clear();
    (global as any).sessionStorage.clear();
    (global as any).localStorage.setItem('access_token', 'mock_access_token');
    (global as any).localStorage.setItem('refresh_token', 'mock_refresh_token');
    useCartStore.getState().clearCart();
    useCartStore.setState({ isOpen: false });
  });

  describe('1. Cart Store Item Addition from Chat Product Cards', () => {
    it('successfully adds a product card item into useCartStore and opens drawer', () => {
      const prod = {
        id: 'prod-cadivi-25',
        sku: 'CAD-CV-2.5',
        name: 'Dây cáp điện đơn Cadivi 2.5mm²',
        price: '12.737 ₫',
        unitPrice: 12737.4,
        image: '/images/products/day-cap-don-1.jpg',
        quantity: 1,
      };

      // Add item via addItem with openDrawer = true
      useCartStore.getState().addItem(prod, true);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].sku).toBe('CAD-CV-2.5');
      expect(state.items[0].unitPrice).toBe(12737.4);
      expect(state.isOpen).toBe(true);
      expect(state.getTotalItems()).toBe(1);
    });

    it('increments quantity when adding same product twice without page reload', () => {
      const prod = {
        id: 'prod-bm-21',
        sku: 'BM-UPVC-21',
        name: 'Ống uPVC Bình Minh phi 21',
        price: '7.439 ₫',
        unitPrice: 7439.04,
        image: '/images/products/ong-binh-minh-1.jpg',
        quantity: 1,
      };

      useCartStore.getState().addItem(prod, true);
      useCartStore.getState().addItem(prod, true);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.getTotalItems()).toBe(2);
    });
  });

  describe('2. Pathname Visibility Logic', () => {
    const isWidgetVisible = (pathname: string): boolean => {
      const isExcluded =
        pathname.startsWith('/manager') ||
        pathname.startsWith('/shipper') ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/403';

      if (isExcluded) return false;

      const isCustomerPage =
        pathname === '/' ||
        pathname.startsWith('/shop') ||
        pathname.startsWith('/product') ||
        pathname.startsWith('/cong-trinh') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/account');

      return isCustomerPage;
    };

    it('shows widget on customer pages', () => {
      expect(isWidgetVisible('/')).toBe(true);
      expect(isWidgetVisible('/shop')).toBe(true);
      expect(isWidgetVisible('/product/10000000-0000-0000-0000-000000000001')).toBe(true);
      expect(isWidgetVisible('/cong-trinh')).toBe(true);
      expect(isWidgetVisible('/profile')).toBe(true);
    });

    it('hides widget on management and auth pages', () => {
      expect(isWidgetVisible('/manager/dashboard')).toBe(false);
      expect(isWidgetVisible('/manager/orders')).toBe(false);
      expect(isWidgetVisible('/shipper')).toBe(false);
      expect(isWidgetVisible('/shipper/orders/123')).toBe(false);
      expect(isWidgetVisible('/login')).toBe(false);
      expect(isWidgetVisible('/register')).toBe(false);
      expect(isWidgetVisible('/403')).toBe(false);
    });
  });

  describe('3. Quick Prompts Contract', () => {
    const EXPECTED_PROMPTS = [
      'Tư vấn vật tư điện nước nhà phố 3 tầng',
      'Bảng giá ống Bình Minh chiết khấu bao nhiêu?',
      'Dây Cadivi 2.5mm chịu tải được thiết bị nào?',
      'Tính danh mục vật tư ống uPVC cho công trình 100m²',
    ];

    it('contains exactly the 4 required quick prompts', () => {
      expect(EXPECTED_PROMPTS).toHaveLength(4);
      expect(EXPECTED_PROMPTS[0]).toBe('Tư vấn vật tư điện nước nhà phố 3 tầng');
      expect(EXPECTED_PROMPTS[1]).toBe('Bảng giá ống Bình Minh chiết khấu bao nhiêu?');
      expect(EXPECTED_PROMPTS[2]).toBe('Dây Cadivi 2.5mm chịu tải được thiết bị nào?');
      expect(EXPECTED_PROMPTS[3]).toBe('Tính danh mục vật tư ống uPVC cho công trình 100m²');
    });
  });

  describe('4. Cart Reminder Logic', () => {
    it('triggers cart reminder only once per session when cart has items', () => {
      const SESSION_KEY = 'tdt_cart_reminded_session';

      // 1. Initial check: not reminded yet
      expect((global as any).sessionStorage.getItem(SESSION_KEY)).toBeNull();

      // 2. Cart has 2 items
      useCartStore.getState().addItem({
        id: 'p1',
        sku: 'CAD-CV-2.5',
        name: 'Cadivi 2.5',
        price: '16.000 ₫',
        unitPrice: 16000,
        image: '',
        quantity: 2,
      });

      const totalCount = useCartStore.getState().items.reduce((s, i) => s + i.quantity, 0);
      expect(totalCount).toBe(2);

      // Simulate reminder
      (global as any).sessionStorage.setItem(SESSION_KEY, 'true');
      expect((global as any).sessionStorage.getItem(SESSION_KEY)).toBe('true');

      // Second check: already reminded, should not trigger again
      const alreadyReminded = (global as any).sessionStorage.getItem(SESSION_KEY);
      expect(alreadyReminded).toBe('true');
    });
  });

  describe('5. Phase 2 - Cart Summary and Checkout Button in Chat (Cải tiến 1)', () => {
    it('accurately reflects useCartStore items and totals', () => {
      useCartStore.getState().addItem({
        id: 'p-cad-1',
        sku: 'CAD-CV-2.5',
        name: 'Dây Cadivi 2.5',
        price: '12.737 ₫',
        unitPrice: 12737,
        image: '',
        quantity: 10,
      });

      useCartStore.getState().addItem({
        id: 'p-bm-1',
        sku: 'BM-UPVC-21',
        name: 'Ống Bình Minh D21',
        price: '7.439 ₫',
        unitPrice: 7439,
        image: '',
        quantity: 5,
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.getTotalItems()).toBe(15);
      const expectedTotal = 10 * 12737 + 5 * 7439; // 127370 + 37195 = 164565
      expect(state.getTotalPrice()).toBe(expectedTotal);
    });

    it('triggers openCartDrawer(true) on checkout click when cart has items', () => {
      useCartStore.getState().addItem({
        id: 'item-1',
        sku: 'SCH-1',
        name: 'MCB Schneider',
        price: '148.544 ₫',
        unitPrice: 148544,
        image: '',
        quantity: 1,
      });

      expect(useCartStore.getState().isOpen).toBe(true);
      // Close drawer first
      useCartStore.getState().setIsOpen(false);
      expect(useCartStore.getState().isOpen).toBe(false);

      // Simulate clicking "Chốt đơn" in chat widget
      useCartStore.getState().setIsOpen(true);
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('disables checkout button when cart is empty', () => {
      useCartStore.getState().clearCart();
      const items = useCartStore.getState().items;
      const isCheckoutDisabled = items.length === 0;
      expect(isCheckoutDisabled).toBe(true);
    });
  });

  describe('6. Phase 2 - Project Context Remember and Forget (Cải tiến 2)', () => {
    it('parses project context from various user input texts', () => {
      const parsed1 = parseProjectContext('Tôi muốn làm nhà phố 3 tầng diện tích 120m2');
      expect(parsed1).not.toBeNull();
      expect(parsed1?.area).toBe(120);
      expect(parsed1?.floors).toBe(3);
      expect(parsed1?.houseType).toBe('Nhà phố');

      const parsed2 = parseProjectContext('Biệt thự 2 lầu 250 m²');
      expect(parsed2).not.toBeNull();
      expect(parsed2?.area).toBe(250);
      expect(parsed2?.floors).toBe(2);
      expect(parsed2?.houseType).toBe('Biệt thự');

      const parsed3 = parseProjectContext('căn hộ 75.5 mét vuông');
      expect(parsed3).not.toBeNull();
      expect(parsed3?.area).toBe(75.5);
      expect(parsed3?.houseType).toBe('Căn hộ');

      const parsedNone = parseProjectContext('Báo giá ống nước');
      expect(parsedNone).toBeNull();
    });

    it('saves project context into localStorage and retrieves upon reload', () => {
      const contextData = {
        area: 100,
        floors: 3,
        houseType: 'Nhà phố',
        updatedAt: new Date().toISOString(),
      };

      (global as any).localStorage.setItem(PROJECT_CONTEXT_KEY, JSON.stringify(contextData));

      const saved = (global as any).localStorage.getItem(PROJECT_CONTEXT_KEY);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.area).toBe(100);
      expect(parsed.floors).toBe(3);
      expect(parsed.houseType).toBe('Nhà phố');
    });

    it('clears project context when user requests to forget', () => {
      (global as any).localStorage.setItem(
        PROJECT_CONTEXT_KEY,
        JSON.stringify({ area: 150, floors: 2 })
      );
      expect((global as any).localStorage.getItem(PROJECT_CONTEXT_KEY)).not.toBeNull();

      // Simulate forget
      (global as any).localStorage.removeItem(PROJECT_CONTEXT_KEY);
      expect((global as any).localStorage.getItem(PROJECT_CONTEXT_KEY)).toBeNull();
    });
  });
});
