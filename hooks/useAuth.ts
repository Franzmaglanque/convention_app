import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
export function useLogin() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (credentials: { username: string; password: string }) => authService.login(credentials),
        onSuccess: (response) => {
            console.log('Login successful:', response);
            // Common auth logic that should always happen
            // Example: Store tokens in secure storage
            // Example: Update global auth state
            // if (response?.token) {
            //     // In a real app, you would store the token here
            //     // await SecureStore.setItemAsync('auth_token', response.token);
            //     console.log('Token received:', response.token);
            // }
        },
        onError: (error) => {
            console.log('Login failed:', error);
            // Common error handling
            // Example: Log to analytics
            // Example: Transform error format
        }
    })
}

