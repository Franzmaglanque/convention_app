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

