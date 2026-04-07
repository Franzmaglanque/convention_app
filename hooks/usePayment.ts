import { paymentService } from '@/services/payment.service';
import { cashPaymentParams, creditCardPaymentParams, gcashPaymentBody, pwalletDebitParams, skyroPaymentBody } from '@/types/payment.types';
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

export function useSaveCreditCardPayment(){
    return useMutation({
        mutationKey: ['save_credit_card_payment'],
        mutationFn: (params:creditCardPaymentParams) => paymentService.saveCreditCardPayment(params),
    })
}

export function useProcessPayment(){
    return useMutation({
        mutationKey: ['process_payment'],
        mutationFn: (params:gcashPaymentBody) => paymentService.processPayment(params),
    })
}

export function useSkyroPayment(){
    return useMutation({
        mutationKey: ['skyro_payment'],
        mutationFn: (params:skyroPaymentBody) => paymentService.saveSkyroPayment(params),
    })
}
