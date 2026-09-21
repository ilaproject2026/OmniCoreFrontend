import { apiClient } from './client';
import { TenantPublicCms, CourierShipment } from '../types';

export const publicPortalApi = {
  getTenantCms: async (tenantSlug: string): Promise<TenantPublicCms> => {
    const response = await apiClient.get(`/public/${tenantSlug}/cms/`);
    return response.data?.data || response.data;
  },

  trackShipmentPublic: async (awbNumber: string): Promise<CourierShipment | null> => {
    const response = await apiClient.get(`/public/track/${awbNumber}/`);
    return response.data?.data || response.data || null;
  },

  submitPublicBooking: async (data: {
    tenantSlug: string;
    serviceType: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    pickupTime?: string;
    estimatedWeightKg?: number;
    notes?: string;
  }): Promise<{ success: boolean; bookingReference: string; message: string }> => {
    const response = await apiClient.post(`/public/${data.tenantSlug}/book/`, data);
    return response.data;
  },
};
