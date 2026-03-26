import { supplierService } from "@/services/supplier.service";
import { useQuery } from "@tanstack/react-query";

export function useFetchTodaySales() {
    return useQuery({
        queryKey: ['today-sales'],
        queryFn: () => supplierService.fetchTodaySales(),
    })
}

