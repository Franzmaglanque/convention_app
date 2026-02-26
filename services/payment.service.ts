import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ScanPwalletQrResponse, cashPaymentResponse, pwalletDebitResponse } from '@/types/payment.types';
import { AxiosResponse } from 'axios';

class PaymentService {

    async pwalletParseQr(params: any): Promise<ScanPwalletQrResponse> {
        const response: AxiosResponse<ScanPwalletQrResponse> = await apiClient.post(
            API_ENDPOINTS.PAYMENTS.PWALLET_PARSE_QR,
            params
        );
     
        return response.data;
    }

    async pwalletDebit(params: any): Promise<pwalletDebitResponse> {
        const response: AxiosResponse<pwalletDebitResponse> = await apiClient.post(
            API_ENDPOINTS.PAYMENTS.PWALLET_DEBIT,
            params
        );
     
        return response.data;
    }

    async saveCashPayment(params:any): Promise<cashPaymentResponse>{
        const response: AxiosResponse<cashPaymentResponse> = await apiClient.post(
            API_ENDPOINTS.PAYMENTS.SAVE_CASH,
            params
        );
        return response.data
    }

}

export const paymentService = new PaymentService();