import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, Store } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setCurrentStore: (store: Store) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      currentStore: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          currentStore: user.stores?.[0] || null,
        });
      },

      setCurrentStore: async (store) => {
        const { user, token } = get();
        if (user && token) {
          try {
            const { apiService } = await import('@/services/api');
            const response = await apiService.post('/store-context/switch', {
              storeId: store.id
            });
            
            // Update token and store context
            set({
              currentStore: store,
              token: response.DDMS_data.token,
              user: { ...user, currentStoreId: store.id },
            });
          } catch (error) {
            console.error('Store switch failed:', error);
            throw error;
          }
        }
      },

      logout: async () => {
        const { token } = get();
        try {
          if (token) {
            const { apiService } = await import('@/services/api');
            await apiService.logout();
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            currentStore: null,
            isAuthenticated: false,
          });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        currentStore: state.currentStore,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);