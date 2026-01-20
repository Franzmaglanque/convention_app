import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AxiosResponse } from 'axios';

class StoreService {
    async getStoreList(): Promise<AxiosResponse<any>> {
        const response:AxiosResponse<any> = await apiClient.get(
            API_ENDPOINTS.STORES.LIST
        )
        return response.data;
    }
}

export const storeService = new StoreService();