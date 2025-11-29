import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Prize {
  id: string;
  name: string;
  image: string;
  value: number;
  chance: number;
}

interface UserState {
  stars: number;
  inventory: Prize[];
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  addStars: (amount: number) => void;
  subtractStars: (amount: number) => boolean;
  addItem: (item: Prize) => void;
  removeItem: (itemId: string) => void;
  sellItem: (itemId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      stars: 1000,
      inventory: [],
      isDemoMode: false,
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      addStars: (amount) => set((state) => ({ stars: state.stars + amount })),
      subtractStars: (amount) => {
        const { stars } = get();
        if (stars >= amount) {
          set({ stars: stars - amount });
          return true;
        }
        return false;
      },
      addItem: (item) => set((state) => ({ inventory: [item, ...state.inventory] })),
      removeItem: (itemId) =>
        set((state) => ({
          inventory: state.inventory.filter((item) => item.id !== itemId),
        })),
      sellItem: (itemId) => {
        const { inventory, addStars } = get();
        const item = inventory.find((i) => i.id === itemId);
        if (item) {
          addStars(item.value);
          set((state) => ({
            inventory: state.inventory.filter((i) => i.id !== itemId),
          }));
        }
      },
    }),
    {
      name: 'banana-cases-user-storage',
    }
  )
);
