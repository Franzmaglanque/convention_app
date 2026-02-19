import { paymentService } from '@/services/payment.service';
import { useMutation } from '@tanstack/react-query';
import { pwalletDebitParams } from '@/types/payment.types';


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
