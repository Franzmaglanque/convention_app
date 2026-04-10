import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

class LoadService {

    async fetchTelcos(){
        const response = await apiClient.get(API_ENDPOINTS.LOAD.FETCH_TELOCOS)
        return response.data;
    }

    async fetchDataPromos(telco: string){
        const response = await apiClient.get(API_ENDPOINTS.LOAD.FETCH_DATA_PROMOS(telco))
        return response.data;
    }
}

// export const storeService = new StoreService();
export const loadService = new LoadService();
