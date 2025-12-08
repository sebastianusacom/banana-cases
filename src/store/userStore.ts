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
  setUserData: (data: { stars?: number; inventory?: Prize[] }) => void;
  fetchUser: () => Promise<void>;
  
  setDemoMode: (mode: boolean) => void;
  toggleDemoMode: () => void;
  addStars: (amount: number) => void;
  subtractStars: (amount: number) => boolean;
  addItem: (item: Prize) => void;
  removeItem: (itemId: string) => void;
  sellItem: (itemId: string) => Promise<void>;
  // resetBalance removed as per request
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
      setUserData: (data) => set((state) => ({
        stars: data.stars !== undefined ? data.stars : state.stars,
        inventory: data.inventory !== undefined ? data.inventory : state.inventory
      })),

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
      
      sellItem: async (itemId) => {
        const { userId } = get();
        if (!userId) return;
        
        try {
            const res = await api.sellItem(userId, itemId);
            if (res.success && res.soldAmount) {
                 set((state) => ({
                    stars: state.stars + res.soldAmount,
                    inventory: state.inventory.filter((i) => i.id !== itemId),
                 }));
            }
        } catch (e) {
            console.error("Sell failed", e);
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
