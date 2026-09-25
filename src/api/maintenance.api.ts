import { apiClient, tenantStorage } from './client';
import { MaintenanceRecord } from '../types';

export const maintenanceApi = {
  getRecords: async (params?: { vehicleId?: string; status?: string }): Promise<MaintenanceRecord[]> => {
    const activeTenantId = tenantStorage.getActiveTenantId();
    const queryParams: Record<string, string> = {};
    if (params?.vehicleId && params.vehicleId !== 'all') queryParams.vehicle = params.vehicleId;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

    let response;
    try {
      response = await apiClient.get<any>('/maintenance/records/', { params: queryParams });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        response = await apiClient.get<any>('/maintenance/', { params: queryParams });
      } else {
        throw err;
      }
    }

    let raw: any[] = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);

    if (activeTenantId) {
      raw = raw.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }

    return raw;
  },

  createRecord: async (payload: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    try {
      const response = await apiClient.post<MaintenanceRecord>('/maintenance/records/', payload);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const response = await apiClient.post<MaintenanceRecord>('/maintenance/', payload);
        return response.data;
      }
      throw err;
    }
  },

  updateRecord: async (id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    try {
      const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/records/${id}/`, updates);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}/`, updates);
        return response.data;
      }
      throw err;
    }
  },
};
