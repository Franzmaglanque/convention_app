import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

class SupplierService {

    async fetchTodaySales(){
        const response = await apiClient.get(API_ENDPOINTS.SUPPLIER.DASHBOARD_SALES)
        return response.data;
    }

    async fetchTopSellingProducts(vendor_code: string){
        const response = await apiClient.get(API_ENDPOINTS.SUPPLIER.TOP_SELLING_PRODUCTS(vendor_code))
        return response.data;
    }

    async fetchPaymentBreakdown(vendor_code: string){
        const response = await apiClient.get(API_ENDPOINTS.SUPPLIER.DASHBOARD_PAYMENT_BREAKDOWN(vendor_code))
        return response.data;
    }
    
}

export const supplierService = new SupplierService();
