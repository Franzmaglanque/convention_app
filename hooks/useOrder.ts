import { useQuery, useMutation } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';

export function newOrder(params:any) {
    return useMutation({
        mutationKey: ['new-order'],
        mutationFn: () => orderService.newOrder(params),
        onSuccess: (response) => {
            console.log('Login successful:', response);
        },
        onError: (error) => {
            console.log('Login failed:', error);
        }
    })
}

