import { productService } from '@/services/product.service';
import { useMutation } from '@tanstack/react-query';

export interface ScanProductParams {
  barcode: string;
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


