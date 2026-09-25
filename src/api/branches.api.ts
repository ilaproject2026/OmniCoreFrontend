import { apiClient, tenantStorage } from './client';
import { Branch } from '../types';

export const branchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    const activeTenantId = tenantStorage.getActiveTenantId();
    const queryParams: Record<string, string> = {};
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

    const response = await apiClient.get<any>('/branches/', { params: queryParams });
    let raw: any[] = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);

    if (activeTenantId) {
      raw = raw.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }

    return raw;
  },

  createBranch: async (payload: Partial<Branch>): Promise<Branch> => {
    const response = await apiClient.post<Branch>('/branches/', payload);
    return response.data;
  },
};
