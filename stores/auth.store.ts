import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from './secureStore';

export interface User {
  id: number;
  fullname: string;
  supplier_code: string;
  supplier_name: string;
  username: string;
  department: 'SUPPLIER' | 'ADMIN'; // Add other departments as needed
  role: 'MANAGER' | 'CASHIER' | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  sessionMessage: string | null;
  
  // Actions
  login: (response: AuthResponse) => void;
  // logout: () => void;
  logout: (message?: string) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearSessionMessage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      sessionMessage: null,
      
      login: (response: AuthResponse) => {
        console.log('Storing login data in auth store:', response);
        set({
          token: response.token,
          user: response.user,
          isAuthenticated: true,
          sessionMessage: null
        });
      },
      
      logout: (message?: string) => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          sessionMessage : message ?? null
        });
      },
      
      setToken: (token: string) => {
        set({ token });
      },
      
      setUser: (user: User) => {
        set({ user });
      },
      clearSessionMessage: () => set({ sessionMessage: null }),
    }),
    {
      name: 'auth-storage', // unique name for the storage key
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
