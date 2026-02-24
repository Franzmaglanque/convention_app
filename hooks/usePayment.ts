import { paymentService } from '@/services/payment.service';
import { cashPaymentParams, pwalletDebitParams } from '@/types/payment.types';
import { useMutation } from '@tanstack/react-query';


export interface ScanPwalletQrParams {
  QrCode: string;
}

export function useScanPwalletQr() {
    return useMutation({
        mutationKey: ['pwallet_qr_parse'],
        mutationFn: (params: ScanPwalletQrParams) => paymentService.pwalletParseQr(params),
        onSuccess: (response) => {
           
        },
        onError: (error) => {
        
        }
    })
}

export function usePwalletDebit() {
    return useMutation({
        mutationKey: ['pwallet_debit'],
        mutationFn: (params: pwalletDebitParams) => paymentService.pwalletDebit(params),
        onSuccess: (response) => {
           
        },
        onError: (error) => {
        
        }
    })
}

export function useSaveCashPayment(){
    return useMutation({
        mutationKey: ['save_cash_payment'],
        mutationFn: (params:cashPaymentParams) => paymentService.saveCashPayment(params),
    })
}
