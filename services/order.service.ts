import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AxiosResponse } from 'axios';

class OrderService {

    async newOrder(params: any): Promise<AxiosResponse<any>> {
        const response: AxiosResponse<any> = await apiClient.post(
            API_ENDPOINTS.ORDER.NEW_ORDER,
            params
        );
        return response.data;
    }
}

export const orderService = new OrderService();
