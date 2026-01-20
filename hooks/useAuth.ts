import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';


export function useLogin() {
    return useMutation({
        mutationKey: ['login'],
        mutationFn: (credentials: { username: string; password: string }) => authService.login(credentials),
        onSuccess: (response) => {
            console.log('Login successful:', response);
        },
        onError: (error) => {
            // console.error('Login failed:', error);
            console.log('Login failed:', error);
        }
    })

}