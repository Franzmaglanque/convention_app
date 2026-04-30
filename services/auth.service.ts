import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { AxiosResponse } from 'axios';

class AuthService {

    async login(credentials: { username: string; password: string }): Promise<AxiosResponse<any>> {
        console.log('process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
        console.log('API_ENDPOINTS.AUTH.LOGIN:', API_ENDPOINTS.AUTH.LOGIN);

        const response: AxiosResponse<any> = await apiClient.post(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
        );
        console.log('login response',response)
        return response.data;
    }

    async logout(){
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {})
        return response.data;
    }

    async validateTrsPin(body:{pin_code:string}){
        const response = await apiClient.post(
            API_ENDPOINTS.AUTH.VALIDATE_TRS_PIN,
            body
        )
        return response.data;
    }
}

export const authService = new AuthService();
