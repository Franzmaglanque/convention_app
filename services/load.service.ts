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

    async processLoadSelling(payload: any){
        const response = await apiClient.post(API_ENDPOINTS.LOAD.PROCESS_LOAD_SELLING, payload)
        return response.data;
    }

    async fetchLoadDetails(order_no: string){
        const response = await apiClient.get(API_ENDPOINTS.LOAD.FETCH_LOAD_DETAILS(order_no))
        return response.data;
    }
}

// export const storeService = new StoreService();
export const loadService = new LoadService();
