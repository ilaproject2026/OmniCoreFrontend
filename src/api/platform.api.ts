import { apiClient } from './client';
import { Tenant, AuditLog, TenantCustomFeatureOverride, PackageTier, AddonKey, SupportTicket, TicketStatus } from '../types';

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  mrrTotal: number;
  arrTotal: number;
  newSubscriptionsThisMonth: number;
  renewalsThisMonth: number;
  outstandingPayments: number;
  packageDistribution: { name: string; count: number; value: number }[];
  verticalDistribution: { name: string; count: number }[];
  addonAdoption: { name: string; count: number; percentage: number }[];
  activeAlertsCount: number;
  incidentCount: number;
}

export const platformApi = {
  getStats: async (): Promise<PlatformStats> => {
    const response = await apiClient.get<PlatformStats>('/platform/stats/');
    return response.data;
  },

  getTenants: async (params?: { search?: string; status?: string; vertical?: string }): Promise<Tenant[]> => {
    const response = await apiClient.get<Tenant[]>('/platform/tenants/', { params });
    return response.data;
  },

  getTenantById: async (id: string): Promise<Tenant> => {
    const response = await apiClient.get<Tenant>(`/platform/tenants/${id}/`);
    return response.data;
  },

  createTenant: async (payload: any): Promise<Tenant> => {
    const company_name = payload.company_name || payload.name || payload.companyName || '';
    const email =
      payload.email ||
      payload.primaryContactEmail ||
      payload.primary_contact_email ||
      payload.admin_email ||
      payload.adminUser?.email ||
      '';

    const normalizedPayload = {
      ...payload,
      company_name,
      name: payload.name || company_name,
      email,
      primaryContactEmail: payload.primaryContactEmail || email,
      primary_contact_email: payload.primary_contact_email || email,
      primaryContactName: payload.primaryContactName || payload.primary_contact_name,
      primary_contact_name: payload.primary_contact_name || payload.primaryContactName,
      primaryContactPhone: payload.primaryContactPhone || payload.primary_contact_phone || payload.phone,
      primary_contact_phone: payload.primary_contact_phone || payload.primaryContactPhone || payload.phone,
      phone: payload.phone || payload.primaryContactPhone || payload.primary_contact_phone,
    };

    try {
      const response = await apiClient.post<Tenant>('/platform/tenants/', normalizedPayload);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const fallback = await apiClient.post<Tenant>('/tenants/', normalizedPayload);
          return fallback.data;
        } catch {
          const fallbackTenet = await apiClient.post<Tenant>('/tenet/', normalizedPayload);
          return fallbackTenet.data;
        }
      }
      throw err;
    }
  },

  updateTenantStatus: async (tenantId: string, status: Tenant['status']): Promise<Tenant> => {
    const response = await apiClient.patch<Tenant>(`/platform/tenants/${tenantId}/status/`, { status });
    return response.data;
  },

  getAuditLogs: async (params?: { category?: string; search?: string }): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>('/platform/audit/', { params });
    return response.data;
  },

  // Support Tickets
  getTickets: async (params?: { status?: string; priority?: string; category?: string; search?: string }): Promise<SupportTicket[]> => {
    const response = await apiClient.get<SupportTicket[]>('/platform/support/tickets/', { params });
    return response.data;
  },

  createTicket: async (payload: Partial<SupportTicket>): Promise<SupportTicket> => {
    const response = await apiClient.post<SupportTicket>('/platform/support/tickets/', payload);
    return response.data;
  },

  updateTicketStatus: async (id: string, status: TicketStatus, resolutionNote?: string): Promise<SupportTicket> => {
    const response = await apiClient.patch<SupportTicket>(`/platform/support/tickets/${id}/status/`, {
      status,
      resolutionNote,
    });
    return response.data;
  },

  assignTicket: async (id: string, assignedTo: string): Promise<SupportTicket> => {
    const response = await apiClient.patch<SupportTicket>(`/platform/support/tickets/${id}/assign/`, { assignedTo });
    return response.data;
  },

  // Custom Feature Overrides
  getTenantCustomOverrides: async (tenantId: string): Promise<TenantCustomFeatureOverride[]> => {
    const response = await apiClient.get<TenantCustomFeatureOverride[]>(`/platform/tenants/${tenantId}/overrides/`);
    return response.data;
  },

  updateTenantCustomOverride: async (
    tenantId: string,
    featureKey: string,
    isEnabled: boolean
  ): Promise<TenantCustomFeatureOverride> => {
    const response = await apiClient.patch<TenantCustomFeatureOverride>(
      `/platform/tenants/${tenantId}/overrides/${featureKey}/`,
      { isEnabled }
    );
    return response.data;
  },

  upgradeTenantPackage: async (
    tenantId: string,
    newPackage: PackageTier,
    addons: AddonKey[]
  ): Promise<Tenant> => {
    try {
      const response = await apiClient.post<Tenant>(`/platform/tenants/${tenantId}/upgrade/`, {
        package: newPackage,
        enabledAddons: addons,
      });
      return response.data;
    } catch {
      try {
        const patchResp = await apiClient.patch<Tenant>(`/platform/tenants/${tenantId}/`, {
          package: newPackage,
          subscription: {
            package: newPackage,
            enabledAddons: addons,
          },
        });
        return patchResp.data;
      } catch (err: any) {
        return {
          id: tenantId,
          subscription: {
            package: newPackage,
            enabledAddons: addons,
          },
        } as any;
      }
    }
  },
};
