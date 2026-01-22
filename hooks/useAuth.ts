import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';
import { useAuthStore, AuthResponse } from '@/stores/auth.store';

export function useLogin() {
    return useMutation<AuthResponse, Error, { username: string; password: string }>({
        mutationKey: ['login'],
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: (response) => {
            console.log('Login successful:', response);
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

