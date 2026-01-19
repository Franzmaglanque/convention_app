import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AxiosResponse } from 'axios';

class StoreService {
    async getStoreList(): Promise<AxiosResponse<any>> {
        console.log('API_ENDPOINTS.STORES.LIST',API_ENDPOINTS.STORES.LIST);
        console.log('apiClient baseURL',apiClient.defaults.baseURL);
        const response:AxiosResponse<any> = await apiClient.get(
            API_ENDPOINTS.STORES.LIST
        )
        return response.data;
    }
}

export const storeService = new StoreService();