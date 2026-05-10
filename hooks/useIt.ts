import { itService } from '@/services/it.service';
import { ChangeUserPassword, ResetUserLogin } from '@/types/auth.types';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useFetchActiveSuppliers() {
  return useQuery({
    queryKey: ['fetch-active-suppliers'],
    queryFn: () => itService.fetchActiveSuppliers(),
  });
}

export function useFetchVendorCashiers(vendor_code:string) {
  return useQuery({
    queryKey: ['fetch-vendor-cashiers',vendor_code],
    queryFn: () => itService.fetchVendorUsers(vendor_code),
    enabled: !!vendor_code
  });
}

export function useResetUserLogin() {
  return useMutation({
    mutationKey: ['reset-user-login'],
    mutationFn: (payload: ResetUserLogin) => itService.reseUserLogin(payload)
  });
}

export function useChangeUserPassword() {
  return useMutation({
    mutationKey: ['change-user-password'],
    mutationFn: (payload: ChangeUserPassword) => itService.changeUserPassword(payload)
  });
}
