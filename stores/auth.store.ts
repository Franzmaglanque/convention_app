import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './secureStore';

export interface User {
  id: number;
  fullname: string;
  supplier_code: string;
  supplier_name: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Add loading state

  login: (response: AuthResponse) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true

      login: (response) =>
        set({
          token: response.token,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setToken: (token) => set({
        token,
        isAuthenticated: !!token && !!get().user,
        isLoading: false,
      }),

      setUser: (user) => set({
        user,
        isAuthenticated: !!get().token && !!user,
        isLoading: false,
      }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        // Don't persist isAuthenticated or isLoading
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Compute isAuthenticated based on token and user after rehydration
          state.isAuthenticated = !!(state.token && state.user);
          state.isLoading = false; // Set loading to false after rehydration
        }
      },
    }
  )
);

