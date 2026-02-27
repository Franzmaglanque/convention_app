import { orderService } from '@/services/order.service';
import { useMutation, useQuery } from '@tanstack/react-query';

export function newOrder() {
  return useMutation({
    mutationKey: ['new-order'],
    mutationFn: (params: any) => orderService.newOrder(params),  // ← Accept params here
    onSuccess: (response) => {

    },
    onError: (error) => {
    }
  })
}

export function useCompleteOrder() {
  return useMutation({
    mutationKey: ['complete-order'],
    mutationFn: (params: any) => orderService.completeOrder(params),  // ← Accept params here
    onSuccess: (response) => {

    },
    onError: (error) => {

    }
  })
}

export function useCancelOrder() {
  return useMutation({
    mutationKey: ['cancel-order'],
    mutationFn: (params: any) => orderService.cancelOrder(params),  // ← Accept params here
    onSuccess: (response) => {

    },
    onError: (error) => {

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

export function useAddItemToOrder(){
  return useMutation({
    mutationKey: ['add-item-to-oder'],
    mutationFn: (params: {
            order_no: string;
            product_id: number;
            sku: string;
            barcode?: string;
            description: string;
            price: string;
    }) => orderService.addItemToOrder(params),
  })
}

export function fetchSupplierOrders(){
  return useQuery({
    queryKey: ['fetch-supplier-orders'],
    queryFn: () => orderService.fetchSupplierOrderList()
  });
}

export function useFetchOrderItems(orderNo: string) {
  return useQuery({
    queryKey: ['order-items', orderNo], 
    queryFn: () => orderService.fetchOrderItemsList(orderNo),
    enabled: !!orderNo,
  });
}

export function useFetchOrderPayments(orderNo: string) {
  return useQuery({
    queryKey: ['order-payments', orderNo], 
    queryFn: () => orderService.fetchOrderPaymentsList(orderNo),
    enabled: !!orderNo,
  });
}

