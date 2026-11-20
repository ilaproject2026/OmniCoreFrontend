import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { publicPortalApi } from '../../api/publicPortal.api';

// ==================== QUERIES ====================

export function usePublicTenantCms(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.publicPortal.site(tenantSlug),
    queryFn: () => publicPortalApi.getTenantCms(tenantSlug),
    enabled: Boolean(tenantSlug),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function usePublicTrackShipment(awbNumber: string) {
  return useQuery({
    queryKey: queryKeys.courier.tracking(awbNumber),
    queryFn: () => publicPortalApi.trackShipmentPublic(awbNumber),
    enabled: Boolean(awbNumber && awbNumber.trim().length > 0),
    refetchInterval: 15000, // 15-second polling for live parcel tracking
  });
}

// ==================== MUTATIONS ====================

export function useSubmitPublicBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof publicPortalApi.submitPublicBooking>[0]) =>
      publicPortalApi.submitPublicBooking(data),
    onSuccess: (res) => {
      if (res.awbNumber) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courier.tracking(res.awbNumber),
        });
      }
    },
  });
}
