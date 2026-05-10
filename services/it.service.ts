import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ChangeUserPassword, RegisterCashierPayload, ResetUserLogin } from '@/types/auth.types';

class ItService {

    async fetchActiveSuppliers(){
        const response = await apiClient.get(API_ENDPOINTS.IT.FETCH_ACTIVE_VENDORS)
        return response.data;
    }

    async fetchVendorUsers(vendor_code:string){
        const response = await apiClient.get(API_ENDPOINTS.IT.FETCH_VENDOR_USERS(vendor_code))
        return response.data;
    }

    async registerCashier(body:RegisterCashierPayload){
        const response = await apiClient.post(
            API_ENDPOINTS.AUTH.REGISTER_CASHIER,
            body
        )
        return response.data;
    }

    async reseUserLogin(body:ResetUserLogin){
        const response = await apiClient.post(
            API_ENDPOINTS.IT.RESET_USER_LOGIN,
            body
        )
        return response.data;
    }

    async changeUserPassword(body:ChangeUserPassword){
        const response = await apiClient.post(
            API_ENDPOINTS.IT.CHANGE_USER_PASSWORD,
            body
        )
        return response.data;
    }
}

export const itService = new ItService();
