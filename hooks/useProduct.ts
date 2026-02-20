import { productService } from '@/services/product.service';
import { useMutation, useQuery } from '@tanstack/react-query';

export interface ScanProductParams {
  barcode: string;
  order_no:string;
}

export function useScanProduct() {
    return useMutation({
        mutationKey: ['scan-product'],
        mutationFn: (params: ScanProductParams) => productService.scanProduct(params),
        onSuccess: (response) => {

        },
        onError: (error) => {
        
        }
    })
}

export function useFetchProductList() {
    return useQuery({
        queryKey: ['product-list'],
        queryFn: () => productService.fetchProductList(),
        
    })
}


