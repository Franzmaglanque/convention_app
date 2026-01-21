import { useQuery, useMutation } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';

export function newOrder() {
    return useMutation({
        mutationKey: ['new-order'],
        mutationFn: () => orderService.newOrder(),
        onSuccess: (response) => {
            console.log('Login successful:', response);
        },
        onError: (error) => {
            console.log('Login failed:', error);
        }
    })
}

