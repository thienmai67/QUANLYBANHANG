import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAccessToken } from '@/lib/auth';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: string;
  unitPrice: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openToCheckout: boolean;
  setIsOpen: (open: boolean) => void;
  setOpenToCheckout: (openToCheckout: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, openDrawer?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openToCheckout: false,

      setIsOpen: (open) => set({ isOpen: open, ...(open ? {} : { openToCheckout: false }) }),
      setOpenToCheckout: (openToCheckout) => set({ openToCheckout }),

      addItem: (newItem, openDrawer = true) => {
        const rawQty = newItem.quantity;
        const addQty =
          typeof rawQty === 'number' && !isNaN(rawQty) && isFinite(rawQty) && rawQty > 0
            ? Math.floor(rawQty)
            : 1;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === newItem.id);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + addQty,
          };
          set({ items: updated, isOpen: openDrawer });
        } else {
          set({
            items: [
              ...currentItems,
              {
                id: newItem.id,
                sku: newItem.sku,
                name: newItem.name,
                price: newItem.price,
                unitPrice: newItem.unitPrice,
                image: newItem.image,
                quantity: addQty,
              },
            ],
            isOpen: openDrawer,
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, delta) => {
        if (typeof delta !== 'number' || isNaN(delta) || !isFinite(delta)) {
          return;
        }
        const updated = get()
          .items.map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        set({ items: updated });
      },

      setQuantity: (id, qty) => {
        if (typeof qty !== 'number' || isNaN(qty) || !isFinite(qty)) {
          return;
        }
        const intQty = Math.floor(qty);
        if (intQty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
          return;
        }
        const updated = get().items.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: intQty };
          }
          return item;
        });
        set({ items: updated });
      },

      clearCart: () => set({ items: [], openToCheckout: false }),

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => {
          const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 0;
          const price = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
          return sum + price * qty;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => {
          const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 0;
          return sum + qty;
        }, 0);
      },
    }),
    {
      name: 'tdt-cart-storage',
      version: 2,
      migrate: () => ({
        items: [],
        isOpen: false,
        openToCheckout: false,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined' && !getAccessToken() && state && state.items.length > 0) {
          state.clearCart();
        }
      },
    }
  )
);
