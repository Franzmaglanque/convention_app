import { loadService } from '@/services/load.service';
import { useMutation, useQuery } from '@tanstack/react-query';

// ginagamit ito para kunin yung mga items ng original order sa return/replace
export function useFetchTelcos(enabled:boolean) {
  return useQuery({
    queryKey: ['fetch-telcos'], 
    queryFn: () => loadService.fetchTelcos(),
    enabled: enabled
  });
}

export function useFetchDataPromos(telco: string | null) {
  return useQuery({
    queryKey: ['fetch-data-promos', telco],
    queryFn: () => loadService.fetchDataPromos(telco!),
    enabled: !!telco
  });
}

export function useProcessLoadSelling() {
  return useMutation({
    mutationKey: ['process-load-selling'],
    mutationFn: (payload: any) => loadService.processLoadSelling(payload)
  });
}

