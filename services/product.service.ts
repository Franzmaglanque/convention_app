import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ProductListReponse, ScanProductParams, ScanProductResponse } from '@/types/product.types';
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

    async fetchProductList(): Promise<ProductListReponse> {
        const response: AxiosResponse<ProductListReponse> = await apiClient.get(
            API_ENDPOINTS.PRODUCTS.PRODUCT_LIST,
        );
        console.log('PRODUCT LIST:', response.data);
        return response.data;
    }

}

export const productService = new ProductService();