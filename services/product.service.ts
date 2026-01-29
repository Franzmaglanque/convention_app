import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Product, ScanProductParams, ScanProductResponse } from '@/types/product.types';
import { AxiosResponse } from 'axios';

class ProductService {

    async scanProduct(params: ScanProductParams): Promise<ScanProductResponse> {
        const response: AxiosResponse<ScanProductResponse> = await apiClient.post(
            API_ENDPOINTS.PRODUCTS.SCAN,
            params
        );
        console.log('SCAN PRODUCT SERVICE:', response.data);
        return response.data;
    }

    async findProductByBarcode(barcode: string): Promise<Product> {
        const response: AxiosResponse<Product> = await apiClient.get(
            API_ENDPOINTS.PRODUCTS.FIND_BY_BARCODE(barcode)
        );
        return response.data;
    }
}

export const productService = new ProductService();