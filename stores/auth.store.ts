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
  
  // Actions
  login: (response: AuthResponse) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (response: AuthResponse) => {
        console.log('Storing login data in auth store:', response);
        set({
          token: response.token,
          user: response.user,
          isAuthenticated: true,
        });
      },
      
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      
      setToken: (token: string) => {
        set({ token });
      },
      
      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage', // unique name for the storage key
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
