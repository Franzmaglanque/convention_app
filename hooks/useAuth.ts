import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';
import { useAuthStore, AuthResponse } from '@/stores/auth.store';

export function useLogin() {
    const { login } = useAuthStore();
    
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (credentials: { username: string; password: string }) => authService.login(credentials),
        onSuccess: (responseData) => {
            // Save the response data to the auth store
            login(responseData.data);
            // console.log('Login successful:', responseData.data);
            router.push('/(tabs)');
        },
        onError: (error) => {
            console.log('Login failed:', error);
            // Common error handling
            // Example: Log to analytics
            // Example: Transform error format
        }
    })
}

// Optional: Add a hook to check authentication status
export function useAuth() {
    const { token, user, isAuthenticated } = useAuthStore();
    
    return {
        token,
        user,
        isAuthenticated,
        isLoading: false, // You can add loading state if needed
    };
}

// Optional: Add a hook for logout
export function useLogout() {
    const { logout } = useAuthStore();
    
    return () => {
        logout();
        router.push('/(auth)/login');
    };
}

