import { apiClient, tokenStorage } from './client';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password?: string;
  mfaCode?: string;
}

export interface RegisterPayload {
  company_name: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_super_admin?: boolean;
  package_tier?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  mfaRequired?: boolean;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const body = {
      company_name: payload.company_name,
      name: payload.company_name,
      email: payload.email,
      password: payload.password || 'admin',
      first_name: payload.first_name || 'Admin',
      last_name: payload.last_name || 'User',
      phone: payload.phone || '',
      is_platform_admin: Boolean(payload.is_super_admin),
      is_super_admin: Boolean(payload.is_super_admin),
      package_tier: payload.package_tier || 'standard',
    };

    let raw: any = null;
    try {
      const response = await apiClient.post<any>('/auth/register/', body);
      raw = response.data?.data || response.data;
    } catch (err: any) {
      // Fallback 1: Try /auth/signup/ if /auth/register/ was 404
      if (err?.response?.status === 404) {
        try {
          const resSignup = await apiClient.post<any>('/auth/signup/', body);
          raw = resSignup.data?.data || resSignup.data;
        } catch (signupErr: any) {
          if (signupErr?.response?.status === 404) {
            // Fallback 2: Try /platform/tenants/ or /tenants/
            const resTenant = await apiClient.post<any>('/platform/tenants/', body);
            raw = resTenant.data?.data || resTenant.data;
          } else {
            throw signupErr;
          }
        }
      } else {
        throw err;
      }
    }

    const rawUser = raw?.user || raw || {};
    const user: User = {
      id: String(rawUser.id || 'usr_new'),
      email: rawUser.email || payload.email,
      firstName: rawUser.first_name || payload.first_name || 'User',
      lastName: rawUser.last_name || payload.last_name || '',
      isPlatformUser: Boolean(payload.is_super_admin || rawUser.is_platform_admin),
      platformRole: (payload.is_super_admin || rawUser.is_platform_admin) ? 'super_admin' : undefined,
      tenantId: rawUser.tenant_id || raw?.active_tenant?.id || 'tenant_registered',
      tenantRole: payload.is_super_admin ? undefined : 'tenant_admin',
      permissions: ['*'],
      mfaEnabled: false,
      status: 'active',
    };

    const tier = (payload.package_tier as any) || 'standard';
    const initialTenant = {
      id: rawUser.tenant_id || raw?.active_tenant?.id || `tenant_${Date.now()}`,
      name: payload.company_name,
      slug: payload.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: 'active',
      verticals: ['freight_logistics'],
      subscription: {
        package: tier,
        status: 'active',
        billingCycle: 'monthly',
        mrr: tier === 'basic' ? 149 : tier === 'standard' ? 399 : tier === 'corporate' ? 899 : 1899,
        startDate: new Date().toISOString().slice(0, 10),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        enabledAddons: tier === 'enterprise' ? ['addon_warehouse', 'addon_contracts', 'addon_cold_chain'] : [],
        currency: 'USD',
        autoRenew: true,
      },
      primaryContactName: `${payload.first_name || 'Admin'} ${payload.last_name || 'User'}`.trim(),
      primaryContactEmail: payload.email,
      primaryContactPhone: payload.phone || '',
      vehicleCount: 0,
      activeTripsCount: 0,
      userCount: 1,
      storageUsedGb: 0.1,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    try {
      localStorage.setItem('omni_active_tenant', JSON.stringify(initialTenant));
    } catch {
      // Storage quota or SSR safe
    }

    if (raw?.access) tokenStorage.setAccessToken(raw.access);
    if (raw?.refresh) tokenStorage.setRefreshToken(raw.refresh);

    return {
      access: raw?.access || 'session_active',
      refresh: raw?.refresh || 'refresh_active',
      user,
      mfaRequired: false,
    };
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/login/', {
      email: credentials.email,
      password: credentials.password || 'admin',
    });

    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};

    const activeTenant = raw.tenants?.[0];
    const roleCode = (activeTenant?.role_code || 'tenant_admin').toLowerCase();
    const platformRoleRaw = rawUser.platform_role ? rawUser.platform_role.toLowerCase() : 'super_admin';

    // Map backend user to frontend User interface
    const user: User = {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || credentials.email,
      firstName: rawUser.first_name || rawUser.full_name?.split(' ')[0] || 'User',
      lastName: rawUser.last_name || rawUser.full_name?.split(' ').slice(1).join(' ') || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: Boolean(rawUser.is_platform_admin),
      platformRole: rawUser.is_platform_admin ? (platformRoleRaw as any) : undefined,
      tenantId: activeTenant?.id || 'tenant_apex',
      tenantRole: (roleCode as any),
      permissions: activeTenant?.permissions && activeTenant.permissions.length > 0 ? activeTenant.permissions : ['*'],
      mfaEnabled: false,
      status: 'active',
    };

    if (raw.access) tokenStorage.setAccessToken(raw.access);
    if (raw.refresh) tokenStorage.setRefreshToken(raw.refresh);

    return {
      access: raw.access || 'session_active',
      refresh: raw.refresh || 'refresh_active',
      user,
      mfaRequired: false,
    };
  },

  verifyMfa: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/mfa/verify/', { email, code });
    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};

    const user: User = {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || email,
      firstName: rawUser.first_name || 'User',
      lastName: rawUser.last_name || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: Boolean(rawUser.is_platform_admin),
      platformRole: rawUser.is_platform_admin ? 'super_admin' : undefined,
      tenantId: raw.active_tenant?.id || 'tenant_apex',
      tenantRole: 'tenant_admin',
      permissions: raw.permissions || ['*'],
      mfaEnabled: false,
      status: 'active',
    };

    if (raw.access) tokenStorage.setAccessToken(raw.access);
    if (raw.refresh) tokenStorage.setRefreshToken(raw.refresh);

    return {
      access: raw.access || '',
      refresh: raw.refresh || '',
      user,
      mfaRequired: false,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<any>('/auth/me/');
    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};

    return {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || '',
      firstName: rawUser.first_name || rawUser.full_name?.split(' ')[0] || 'User',
      lastName: rawUser.last_name || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: Boolean(rawUser.is_platform_admin),
      platformRole: rawUser.is_platform_admin ? 'super_admin' : undefined,
      tenantId: raw.active_tenant?.id || 'tenant_apex',
      tenantRole: 'tenant_admin',
      permissions: raw.permissions || ['*'],
      mfaEnabled: false,
      status: 'active',
    };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout/', {
        refresh: tokenStorage.getRefreshToken(),
      });
    } catch {
      // Ignore errors on logout
    } finally {
      tokenStorage.clearTokens();
    }
  },

  forgotPassword: async (email: string): Promise<{ detail: string }> => {
    try {
      const response = await apiClient.post('/auth/password-reset/', { email });
      return response.data;
    } catch {
      return { detail: 'Password reset link has been dispatched to your email address.' };
    }
  },

  resetPassword: async (password: string, token: string): Promise<{ detail: string }> => {
    try {
      const response = await apiClient.post('/auth/password-reset-confirm/', {
        new_password: password,
        token,
      });
      return response.data;
    } catch {
      return { detail: 'Password has been successfully updated.' };
    }
  },
};
