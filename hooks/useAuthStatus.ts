import { useAuthStore } from '@/stores/auth.store';

export function useAuthStatus() {
  const { isAuthenticated, token, user, isLoading } = useAuthStore();
  
  return {
    isAuthenticated,
    token,
    user,
    isLoading,
  };
}
