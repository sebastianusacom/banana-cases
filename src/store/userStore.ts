import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';

export interface Prize {
  id: string;
  name: string;
  image: string;
  lottie?: string;
  value: number;
  chance: number;
  wonAt?: number;
}

interface UserState {
  userId: string | null;
  stars: number;
  inventory: Prize[];
  isDemoMode: boolean;
  isLoading: boolean;
  
  setUserId: (id: string) => void;
  fetchUser: () => Promise<void>;
  
  setDemoMode: (mode: boolean) => void;
  toggleDemoMode: () => void;
  addStars: (amount: number) => void;
  subtractStars: (amount: number) => boolean;
  addItem: (item: Prize) => void;
  removeItem: (itemId: string) => void;
  sellItem: (itemId: string) => void;
  resetBalance: () => void; 
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      stars: 1000,
      inventory: [],
      isDemoMode: false,
      isLoading: false,

      setUserId: (id) => set({ userId: id }),

      fetchUser: async () => {
        const { userId } = get();
        if (!userId) return;
        
        set({ isLoading: true });
        try {
          const userData = await api.getUser(userId);
          if (userData && userData.stars !== undefined) {
             set({ stars: userData.stars, inventory: userData.inventory || [] });
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
        } finally {
          set({ isLoading: false });
        }
      },

      setDemoMode: (mode) => set(() => ({ isDemoMode: mode })),
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      resetBalance: () => set({ stars: 1000 }), 
      addStars: (amount) => set((state) => ({ stars: state.stars + amount })),
      
      // Optimistic update (client-side check), but server is source of truth
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
      partialize: (state) => ({ 
        isDemoMode: state.isDemoMode,
        // Don't persist sensitive data if you want fresh fetch on reload, 
        // but persisting userId is helpful.
        userId: state.userId 
      }),
    }
  )
);
