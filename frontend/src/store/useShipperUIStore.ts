import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShipperUIState {
  isHighContrast: boolean;
  activeTab: 'SHIPPING' | 'PACKING' | '2H' | 'COMPLETED';
  setActiveTab: (tab: 'SHIPPING' | 'PACKING' | '2H' | 'COMPLETED') => void;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
}

export const useShipperUIStore = create<ShipperUIState>()(
  persist(
    (set) => ({
      isHighContrast: false,
      activeTab: 'SHIPPING',
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleHighContrast: () =>
        set((state) => ({ isHighContrast: !state.isHighContrast })),
      setHighContrast: (enabled: boolean) =>
        set({ isHighContrast: enabled }),
    }),
    {
      name: 'tdt-shipper-ui-storage',
    }
  )
);
