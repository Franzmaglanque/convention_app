import { supplierService } from "@/services/supplier.service";
import { useQuery } from "@tanstack/react-query";

export function useFetchTodaySales() {
    return useQuery({
        queryKey: ['today-sales'],
        queryFn: () => supplierService.fetchTodaySales(),
    })
}

export function useFetchTopSellingProducts(vendor_code:string) {
    return useQuery({
        queryKey: ['top-selling-products', vendor_code],
        queryFn: () => supplierService.fetchTopSellingProducts(vendor_code),
    })
}

export function useFetchPaymentBreakdown(vendor_code:string) {
    return useQuery({
        queryKey: ['payment-breakdown', vendor_code],
        queryFn: () => supplierService.fetchPaymentBreakdown(vendor_code),
    })
}

export function useCashierAnalytics(selectedDate?:string) {
    return useQuery({
        queryKey: ['cashier-analytics', selectedDate],
        queryFn: () => supplierService.fetchCashierAnalytics(selectedDate),
        enabled: !!selectedDate
    })
}

export function useFetchCashiers(selectedDate?:string) {
    return useQuery({
        queryKey: ['supplier-cashiers', selectedDate],
        queryFn: () => supplierService.fetchCashiers(),
    })
}

