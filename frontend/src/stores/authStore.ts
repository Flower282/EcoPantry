import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface AuthState {
  token: string | null;
  user: { email: string; name: string } | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          localStorage.setItem('ecopantry_token', data.token);
          set({ token: data.token, user: { email: data.email, name: data.name }, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      signup: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.signup(email, password);
          localStorage.setItem('ecopantry_token', data.token);
          set({ token: data.token, user: { email: data.email, name: data.name }, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('ecopantry_token');
        set({ token: null, user: null, error: null });
      },

      clearError: () => set({ error: null }),

      updateUser: (name) => set((state) => ({
        user: state.user ? { ...state.user, name } : null
      })),
    }),
    {
      name: 'ecopantry-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
