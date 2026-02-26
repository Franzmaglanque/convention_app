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

    async completeOrder(params:any){
        const response = await apiClient.post(
            API_ENDPOINTS.ORDER.COMPLETE_ORDER,
            params
        )
        return response.data;
    }

    async updateOrderItem(params: { order_no: string; product_id: number; quantity: number }) {
        const response = await apiClient.patch(API_ENDPOINTS.ORDER.UPDATE_ITEM, params);
        return response.data;
    }

    async removeOrderItem(params: { order_no: string; product_id: number }) {
        const response = await apiClient.delete(API_ENDPOINTS.ORDER.REMOVE_ITEM, { data: params });
        return response.data;
    }

    async addItemToOrder(params:{
        order_no: string;
        product_id: number;
        sku: string;
        barcode?: string;
        description: string;
        price: string;
    }){
        console.log('addItemToOrder',params);

        const response = await apiClient.post(API_ENDPOINTS.ORDER.ADD_ITEM,params);
        return response.data;
    }

    async fetchSupplierOrderList(){
        const response = await apiClient.get(API_ENDPOINTS.ORDER.SUPPLIER_ORDER_LIST)
        return response.data;
    }
    
}

export const orderService = new OrderService();
