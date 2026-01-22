import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { router } from 'expo-router';
export function useLogin() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (credentials: { username: string; password: string }) => authService.login(credentials),
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

