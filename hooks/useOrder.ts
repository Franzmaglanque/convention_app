import { orderService } from '@/services/order.service';
import { useMutation } from '@tanstack/react-query';

export function newOrder() {
  return useMutation({
    mutationKey: ['new-order'],
    mutationFn: (params: any) => orderService.newOrder(params),  // ← Accept params here
    onSuccess: (response) => {
      console.log('Login successful:', response);
    },
    onError: (error) => {
      console.log('Login failed:', error);
    }
  })
}

export function useUpdateOrderItem() {
    return useMutation({
        mutationKey: ['update-order-item'],
        mutationFn: (params: { order_no: string; product_id: number; quantity: number }) =>
            orderService.updateOrderItem(params),
    });
}

export function useRemoveOrderItem() {
    return useMutation({
        mutationKey: ['remove-order-item'],
        mutationFn: (params: { order_no: string; product_id: number }) =>
            orderService.removeOrderItem(params),
    });
}

