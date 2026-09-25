import { apiClient, tokenStorage, tenantStorage } from './client';
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
    const isSuperAdminRequested = Boolean(payload.is_super_admin);
    const body = {
      company_name: payload.company_name,
      name: payload.company_name,
      email: payload.email,
      password: payload.password,
      first_name: payload.first_name || 'Admin',
      last_name: payload.last_name || 'User',
      phone: payload.phone || '',
      is_platform_admin: isSuperAdminRequested,
      is_super_admin: isSuperAdminRequested,
      package_tier: payload.package_tier || 'standard',
      subscription_plan: payload.package_tier || 'standard',
      status: 'active',
      role: isSuperAdminRequested ? 'SUPER_ADMIN' : 'TENANT_ADMIN',
    };

    let raw: any;
    try {
      const response = await apiClient.post<any>('/auth/register/', body);
      raw = response.data?.data || response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Fallback 1: Try /auth/signup/
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
    // Extract real tenant UUID
    const tenantUuid =
      raw?.tenant?.id ||
      rawUser?.tenant_uuid ||
      (typeof rawUser?.tenant_id === 'string' && rawUser.tenant_id.length > 20 ? rawUser.tenant_id : undefined) ||
      raw?.active_tenant?.id;

    const tenantId = tenantUuid || rawUser.tenant_id || `tenant_${Date.now()}`;

    // Immediately register active tenant in tenantStorage so client interceptor sends correct X-Tenant-ID
    tenantStorage.setActiveTenantId(tenantId);

    const isPlatformUser = Boolean(
      isSuperAdminRequested ||
      rawUser.is_platform_admin ||
      rawUser.is_super_admin ||
      rawUser.is_platform_user ||
      rawUser.platform_role === 'SUPER_ADMIN'
    );

    const user: User = {
      id: String(rawUser.id || 'usr_new'),
      email: rawUser.email || payload.email,
      firstName: rawUser.first_name || payload.first_name || 'Admin',
      lastName: rawUser.last_name || payload.last_name || 'User',
      isPlatformUser,
      platformRole: isPlatformUser ? 'super_admin' : undefined,
      tenantId,
      tenantRole: isPlatformUser ? undefined : 'tenant_admin',
      permissions: Array.isArray(rawUser.permissions)
        ? rawUser.permissions
        : Array.isArray(raw?.permissions)
        ? raw.permissions
        : ['*'],
      mfaEnabled: false,
      status: 'active',
    };

    const tier = (payload.package_tier as any) || 'standard';
    const initialTenant = {
      id: tenantId,
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
      localStorage.setItem('omni_org_owner_email', payload.email.trim().toLowerCase());
      localStorage.setItem('omni_registered_company', payload.company_name.trim());
    } catch {
      // Storage safe
    }

    if (raw?.access) tokenStorage.setAccessToken(raw.access);
    if (raw?.refresh) tokenStorage.setRefreshToken(raw.refresh);

    return {
      access: raw?.access || '',
      refresh: raw?.refresh || '',
      user,
      mfaRequired: false,
    };
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/login/', {
      email: credentials.email,
      password: credentials.password,
    });

    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};
    const activeTenant = raw.tenants?.[0] || raw.active_tenant;

    const roleUpper = String(rawUser.role || rawUser.platform_role || activeTenant?.role_code || '').toUpperCase();
    const isPlatformAdmin = Boolean(
      rawUser.is_platform_admin ||
      rawUser.is_super_admin ||
      rawUser.is_platform_user ||
      rawUser.platform_role === 'SUPER_ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN'
    );

    const isMfaRequired = Boolean(raw.mfa_required || raw.mfaRequired || rawUser.mfa_required);

    const tenantUuid =
      activeTenant?.id ||
      rawUser.tenant_uuid ||
      (typeof rawUser.tenant_id === 'string' && rawUser.tenant_id.length > 20 ? rawUser.tenant_id : undefined) ||
      raw.tenant?.id;

    let resolvedTenantId = tenantUuid || activeTenant?.id || rawUser.tenant_id;

    if (tenantUuid) {
      tenantStorage.setActiveTenantId(tenantUuid);
    } else if (resolvedTenantId) {
      tenantStorage.setActiveTenantId(resolvedTenantId);
    }

    if (activeTenant) {
      try {
        const tenantToSave = {
          id: resolvedTenantId || `tenant_${Date.now()}`,
          name: activeTenant.company_name || activeTenant.name || 'Organization Workspace',
          slug: (activeTenant.company_name || activeTenant.name || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: (activeTenant.status || 'active').toLowerCase(),
          verticals: activeTenant.verticals || ['freight_logistics'],
          subscription: activeTenant.subscription || {
            package: (activeTenant.package_tier || 'standard').toLowerCase(),
            status: 'active',
            billingCycle: 'monthly',
            mrr: 0,
            startDate: new Date().toISOString().slice(0, 10),
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            enabledAddons: [],
            currency: 'USD',
            autoRenew: true,
          },
          primaryContactName: `${rawUser.first_name || ''} ${rawUser.last_name || ''}`.trim() || 'Admin User',
          primaryContactEmail: rawUser.email || credentials.email,
          primaryContactPhone: rawUser.phone || '',
          vehicleCount: 0,
          activeTripsCount: 0,
          userCount: 1,
          storageUsedGb: 0.1,
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        localStorage.setItem('omni_active_tenant', JSON.stringify(tenantToSave));
      } catch {
        // Storage safe
      }
    }

    const tenantRole = isPlatformAdmin
      ? undefined
      : (rawUser.tenant_role ? String(rawUser.tenant_role).toLowerCase() : rawUser.role ? String(rawUser.role).toLowerCase() : 'tenant_admin');

    const userPermissions: string[] = Array.isArray(rawUser.permissions)
      ? rawUser.permissions
      : Array.isArray(raw.permissions)
      ? raw.permissions
      : ['*'];

    const user: User = {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || credentials.email,
      firstName: rawUser.first_name || rawUser.full_name?.split(' ')[0] || 'User',
      lastName: rawUser.last_name || rawUser.full_name?.split(' ').slice(1).join(' ') || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: isPlatformAdmin,
      platformRole: isPlatformAdmin ? 'super_admin' : undefined,
      tenantId: resolvedTenantId,
      tenantRole: tenantRole as any,
      permissions: userPermissions,
      mfaEnabled: isMfaRequired || Boolean(rawUser.mfa_enabled),
      status: 'active',
    };

    if (raw.access) tokenStorage.setAccessToken(raw.access);
    if (raw.refresh) tokenStorage.setRefreshToken(raw.refresh);

    return {
      access: raw.access || '',
      refresh: raw.refresh || '',
      user,
      mfaRequired: isMfaRequired,
    };
  },

  verifyMfa: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/mfa/verify/', { email, code });
    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};

    const roleUpper = String(rawUser.role || rawUser.platform_role || '').toUpperCase();
    const isPlatformAdmin = Boolean(
      rawUser.is_platform_admin ||
      rawUser.is_super_admin ||
      rawUser.is_platform_user ||
      rawUser.platform_role === 'SUPER_ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN'
    );

    const userPermissions: string[] = Array.isArray(rawUser.permissions)
      ? rawUser.permissions
      : Array.isArray(raw.permissions)
      ? raw.permissions
      : ['*'];

    const user: User = {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || email,
      firstName: rawUser.first_name || 'User',
      lastName: rawUser.last_name || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: isPlatformAdmin,
      platformRole: isPlatformAdmin ? 'super_admin' : undefined,
      tenantId: raw.active_tenant?.id,
      tenantRole: isPlatformAdmin ? undefined : 'tenant_admin',
      permissions: userPermissions,
      mfaEnabled: true,
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
    const activeTenant = raw.active_tenant || raw.tenants?.[0];

    const roleUpper = String(rawUser.role || rawUser.platform_role || activeTenant?.role_code || '').toUpperCase();
    const isPlatformAdmin = Boolean(
      rawUser.is_platform_admin ||
      rawUser.is_super_admin ||
      rawUser.is_platform_user ||
      rawUser.platform_role === 'SUPER_ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN'
    );

    let resolvedTenantId = activeTenant?.id;
    if (!resolvedTenantId) {
      try {
        const savedTenant = localStorage.getItem('omni_active_tenant');
        if (savedTenant) {
          resolvedTenantId = JSON.parse(savedTenant).id;
        }
      } catch {
        // ignore
      }
    }

    const tenantRole = isPlatformAdmin
      ? undefined
      : (rawUser.tenant_role ? String(rawUser.tenant_role).toLowerCase() : rawUser.role ? String(rawUser.role).toLowerCase() : 'tenant_admin');

    const userPermissions: string[] = Array.isArray(rawUser.permissions)
      ? rawUser.permissions
      : Array.isArray(raw.permissions)
      ? raw.permissions
      : ['*'];

    return {
      id: String(rawUser.id || 'user_current'),
      email: rawUser.email || '',
      firstName: rawUser.first_name || rawUser.full_name?.split(' ')[0] || 'User',
      lastName: rawUser.last_name || '',
      avatar: rawUser.avatar || undefined,
      isPlatformUser: isPlatformAdmin,
      platformRole: isPlatformAdmin ? 'super_admin' : undefined,
      tenantId: resolvedTenantId,
      tenantRole: tenantRole as any,
      permissions: userPermissions,
      mfaEnabled: Boolean(rawUser.mfa_enabled),
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
    const response = await apiClient.post('/auth/password-reset/', { email });
    return response.data || { detail: 'Password reset link has been dispatched to your email address.' };
  },

  resetPassword: async (password: string, token: string): Promise<{ detail: string }> => {
    const response = await apiClient.post('/auth/password-reset-confirm/', {
      new_password: password,
      token,
    });
    return response.data || { detail: 'Password has been successfully updated.' };
  },
};
