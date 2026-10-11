import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        const addQty = newItem.quantity && newItem.quantity > 0 ? newItem.quantity : 1;
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

      clearCart: () => set({ items: [], openToCheckout: false }),

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'tdt-cart-storage',
    }
  )
);
