import { apiClient } from './client';
import {
  Tenant,
  TenantStatus,
  TenantSubscription,
  AuditLog,
  TenantCustomFeatureOverride,
  PackageTier,
  AddonKey,
  SupportTicket,
  TicketStatus,
  BackendPackage,
} from '../types';

export const BACKEND_PACKAGE_UUID_FALLBACKS: Record<string, string> = {
  enterprise: '18321b13-9bd0-4d52-ac59-607ef6ae260d',
  corporate: '9886df72-d63b-417f-b557-174f2c628839',
  standard: 'bf603b6f-d37b-4437-9b5e-bb6330ccb909',
  basic: 'bf603b6f-d37b-4437-9b5e-bb6330ccb909',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (val?: any): boolean => {
  return typeof val === 'string' && UUID_REGEX.test(val.trim());
};

let cachedPackages: BackendPackage[] = [];

export const resolvePackageUuid = async (packageInput?: any): Promise<string | undefined> => {
  if (!packageInput) return undefined;
  if (isUuid(packageInput)) return packageInput;

  const key = String(packageInput).toLowerCase().trim();

  // 1. Try cached packages first
  if (cachedPackages.length > 0) {
    const match = cachedPackages.find(
      (p) => p.code?.toLowerCase() === key || p.name?.toLowerCase().includes(key)
    );
    if (match && isUuid(match.id)) {
      return match.id;
    }
  }

  // 2. Try fetching fresh packages from /packages/
  try {
    const res = await apiClient.get<any>('/packages/');
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.results || []);
    if (Array.isArray(list) && list.length > 0) {
      cachedPackages = list;
      const match = list.find(
        (p: any) => p.code?.toLowerCase() === key || p.name?.toLowerCase().includes(key)
      );
      if (match && isUuid(match.id)) {
        return match.id;
      }
    }
  } catch {
    // Ignore network failures and fall back to known database UUIDs
  }

  return BACKEND_PACKAGE_UUID_FALLBACKS[key] || BACKEND_PACKAGE_UUID_FALLBACKS.standard;
};

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

export const normalizeTenantResponse = (data: any): Tenant => {
  if (!data) return data;
  const name = data.company_name || data.name || 'Unnamed Tenant';
  const slug =
    data.slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') ||
    'tenant';
  const rawStatus = (data.status || 'ACTIVE').toLowerCase();

  let status: TenantStatus = 'active';
  if (rawStatus === 'draft') status = 'draft';
  else if (rawStatus === 'trial') status = 'trial';
  else if (rawStatus === 'suspended') status = 'suspended';
  else if (rawStatus === 'cancelled') status = 'cancelled';
  else if (rawStatus === 'provisioning') status = 'provisioning';
  else status = 'active';

  // Package resolution
  let pkgTier: PackageTier = 'standard';
  if (data.package_name) {
    const pn = data.package_name.toLowerCase();
    if (pn.includes('enterprise')) pkgTier = 'enterprise';
    else if (pn.includes('corporate')) pkgTier = 'corporate';
    else pkgTier = 'standard';
  } else if (typeof data.package === 'string') {
    if (
      data.package === BACKEND_PACKAGE_UUID_FALLBACKS.enterprise ||
      data.package.toLowerCase().includes('enterprise')
    ) {
      pkgTier = 'enterprise';
    } else if (
      data.package === BACKEND_PACKAGE_UUID_FALLBACKS.corporate ||
      data.package.toLowerCase().includes('corporate')
    ) {
      pkgTier = 'corporate';
    } else {
      pkgTier = 'standard';
    }
  } else if (data.package_tier) {
    pkgTier = String(data.package_tier).toLowerCase() as PackageTier;
  }

  const subscription: TenantSubscription = data.subscription || {
    package: pkgTier,
    status: status === 'active' ? 'active' : status === 'trial' ? 'trial' : 'past_due',
    billingCycle: 'monthly',
    startDate: data.created_at || data.createdAt || new Date().toISOString(),
    renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    mrr: pkgTier === 'enterprise' ? 4999 : pkgTier === 'corporate' ? 2499 : 1299,
    currency: 'USD',
    enabledAddons: Array.isArray(data.enabledAddons) ? data.enabledAddons : [],
    autoRenew: true,
  };

  return {
    ...data,
    id: data.id || data.tenant_id || '',
    name,
    slug,
    logo: data.logo || undefined,
    status,
    primaryContactName:
      data.primary_contact_name || data.primaryContactName || data.contact_person || name,
    primaryContactEmail:
      data.email || data.primary_contact_email || data.primaryContactEmail || '',
    primaryContactPhone:
      data.phone || data.primary_contact_phone || data.primaryContactPhone || '',
    country: data.country || 'United States',
    city: data.city || '',
    address: data.address || '',
    verticals:
      Array.isArray(data.verticals) && data.verticals.length > 0
        ? data.verticals
        : ['freight_logistics'],
    subscription,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
    vehicleCount: data.vehicle_count ?? data.vehicleCount ?? 0,
    activeTripsCount: data.active_trips_count ?? data.activeTripsCount ?? 0,
    userCount: data.user_count ?? data.userCount ?? 1,
    storageUsedGb: data.storage_used_gb ?? data.storageUsedGb ?? 0,
  };
};

export const platformApi = {
  getStats: async (): Promise<PlatformStats> => {
    const response = await apiClient.get<PlatformStats>('/platform/stats/');
    return response.data;
  },

  getPackages: async (): Promise<BackendPackage[]> => {
    try {
      const response = await apiClient.get<any>('/packages/');
      const list = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || response.data?.results || []);
      if (Array.isArray(list) && list.length > 0) {
        cachedPackages = list;
        return list;
      }
    } catch {
      // ignore
    }
    return [
      { id: BACKEND_PACKAGE_UUID_FALLBACKS.standard, code: 'STANDARD', name: 'OmniCore Standard' },
      { id: BACKEND_PACKAGE_UUID_FALLBACKS.corporate, code: 'CORPORATE', name: 'OmniCore Corporate' },
      { id: BACKEND_PACKAGE_UUID_FALLBACKS.enterprise, code: 'ENTERPRISE', name: 'OmniCore Enterprise' },
    ];
  },

  getTenants: async (params?: { search?: string; status?: string; vertical?: string }): Promise<Tenant[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== 'all') {
      // Backend DRF expects choices in UPPERCASE (e.g. ACTIVE, DRAFT, TRIAL, SUSPENDED)
      queryParams.status = params.status.toUpperCase();
    }
    if (params?.vertical && params.vertical !== 'all') {
      queryParams.vertical = params.vertical;
    }

    try {
      const response = await apiClient.get<any>('/platform/tenants/', { params: queryParams });
      const rawList = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || response.data?.data || []);
      return rawList.map(normalizeTenantResponse);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const fallback = await apiClient.get<any>('/tenants/', { params: queryParams });
          const rawList = Array.isArray(fallback.data)
            ? fallback.data
            : (fallback.data?.results || fallback.data?.data || []);
          return rawList.map(normalizeTenantResponse);
        } catch {
          return [];
        }
      }
      throw err;
    }
  },

  getTenantById: async (id: string): Promise<Tenant> => {
    try {
      const response = await apiClient.get<any>(`/platform/tenants/${id}/`);
      const item = response.data?.data || response.data;
      return normalizeTenantResponse(item);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const fallback = await apiClient.get<any>(`/tenants/${id}/`);
        const item = fallback.data?.data || fallback.data;
        return normalizeTenantResponse(item);
      }
      throw err;
    }
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

    // Resolve package to valid UUID if string tier provided (fixes DRF PrimaryKeyRelatedField UUID validation)
    let packageId = payload.package;
    if (packageId && !isUuid(packageId)) {
      packageId = await resolvePackageUuid(packageId);
    } else if (!packageId && payload.package_tier) {
      packageId = await resolvePackageUuid(payload.package_tier);
    }

    const normalizedPayload = {
      ...payload,
      company_name,
      name: payload.name || company_name,
      email,
      package: packageId,
      package_tier: payload.package_tier || payload.package,
      primaryContactEmail: payload.primaryContactEmail || email,
      primary_contact_email: payload.primary_contact_email || email,
      primaryContactName: payload.primaryContactName || payload.primary_contact_name,
      primary_contact_name: payload.primary_contact_name || payload.primaryContactName,
      primaryContactPhone: payload.primaryContactPhone || payload.primary_contact_phone || payload.phone,
      primary_contact_phone: payload.primary_contact_phone || payload.primaryContactPhone || payload.phone,
      phone: payload.phone || payload.primaryContactPhone || payload.primary_contact_phone,
    };

    try {
      const response = await apiClient.post<any>('/platform/tenants/', normalizedPayload);
      const data = response.data?.data || response.data;
      return normalizeTenantResponse(data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const fallback = await apiClient.post<any>('/tenants/', normalizedPayload);
          const data = fallback.data?.data || fallback.data;
          return normalizeTenantResponse(data);
        } catch {
          const fallbackTenet = await apiClient.post<any>('/tenet/', normalizedPayload);
          const data = fallbackTenet.data?.data || fallbackTenet.data;
          return normalizeTenantResponse(data);
        }
      }
      throw err;
    }
  },

  updateTenantStatus: async (tenantId: string, status: Tenant['status']): Promise<Tenant> => {
    try {
      const response = await apiClient.patch<any>(`/platform/tenants/${tenantId}/`, {
        status: status.toUpperCase(),
      });
      const data = response.data?.data || response.data;
      return normalizeTenantResponse(data);
    } catch {
      const response = await apiClient.patch<any>(`/platform/tenants/${tenantId}/status/`, {
        status: status.toUpperCase(),
      });
      const data = response.data?.data || response.data;
      return normalizeTenantResponse(data);
    }
  },

  updateTenant: async (tenantId: string, payload: Partial<Tenant>): Promise<Tenant> => {
    try {
      const response = await apiClient.patch<any>(`/platform/tenants/${tenantId}/`, payload);
      const data = response.data?.data || response.data;
      return normalizeTenantResponse(data);
    } catch {
      const response = await apiClient.patch<any>(`/tenants/${tenantId}/`, payload);
      const data = response.data?.data || response.data;
      return normalizeTenantResponse(data);
    }
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
    const packageUuid = await resolvePackageUuid(newPackage);
    try {
      const response = await apiClient.post<Tenant>(`/platform/tenants/${tenantId}/upgrade/`, {
        package: packageUuid,
        package_tier: newPackage,
        enabledAddons: addons,
      });
      return response.data;
    } catch {
      try {
        const patchResp = await apiClient.patch<Tenant>(`/platform/tenants/${tenantId}/`, {
          package: packageUuid,
          package_tier: newPackage,
          subscription: {
            package: newPackage,
            package_id: packageUuid,
            enabledAddons: addons,
          },
        });
        return patchResp.data;
      } catch (err: any) {
        throw err;
      }
    }
  },
};
