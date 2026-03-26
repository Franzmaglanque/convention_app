import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

class SupplierService {

    async fetchTodaySales(){
        const response = await apiClient.get(API_ENDPOINTS.SUPPLIER.DASHBOARD_SALES)
        return response.data;
    }
    
}

export const supplierService = new SupplierService();
