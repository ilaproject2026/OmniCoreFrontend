import { apiClient, tokenStorage, tenantStorage } from './client';
import { PackageTier, User } from '../types';

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
  packageTier?: PackageTier;
  packageVerified?: boolean;
}

const toPackageTier = (value: unknown): PackageTier | undefined => {
  const code = String(value || '').toLowerCase();
  return code === 'basic' || code === 'standard' || code === 'corporate' || code === 'enterprise'
    ? code
    : undefined;
};

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const body = {
      company_name: payload.company_name,
      admin_email: payload.email.trim().toLowerCase(),
      admin_password: payload.password,
      admin_first_name: payload.first_name || 'Admin',
      admin_last_name: payload.last_name || 'User',
      phone: payload.phone || '',
      package_code: (payload.package_tier || 'standard').toUpperCase(),
      billing_cycle: 'MONTHLY',
      vertical_codes: payload.package_tier === 'enterprise' ? ['all_verticals'] : ['freight_logistics'],
    };

    // Public onboarding endpoint provisions the tenant and initial tenant admin.
    const provisionResponse = await apiClient.post<any>('/platform/tenants/provision/', body);
    const provisionedTenantId = provisionResponse.data?.tenant_id;
    // Provisioning does not issue JWTs, so sign in through the canonical auth endpoint.
    return authApi.login(
      { email: payload.email.trim().toLowerCase(), password: payload.password },
      provisionedTenantId
    );
  },

  login: async (credentials: LoginCredentials, preferredTenantId?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/auth/login/', {
      email: credentials.email,
      password: credentials.password,
    });

    const raw = response.data?.data || response.data;
    const rawUser = raw.user || {};
    const memberships = Array.isArray(raw.tenants) ? raw.tenants : [];
    const preferredTenant = preferredTenantId
      ? memberships.find((tenant: any) => tenant.id === preferredTenantId || tenant.tenant_id === preferredTenantId)
      : undefined;
    const activeTenant = preferredTenant || memberships[0] || raw.active_tenant;

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
    let packageTier = toPackageTier(
      activeTenant?.package_code || activeTenant?.package?.code || activeTenant?.package_tier || activeTenant?.subscription?.package
    );
    let packageVerified = Boolean(packageTier);

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
          subscription: {
            ...(activeTenant.subscription || {}),
            package: packageTier || 'standard',
            status: activeTenant.subscription?.status || 'active',
            billingCycle: activeTenant.subscription?.billingCycle || 'monthly',
            mrr: activeTenant.subscription?.mrr || 0,
            startDate: activeTenant.subscription?.startDate || new Date().toISOString().slice(0, 10),
            renewalDate: activeTenant.subscription?.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            enabledAddons: activeTenant.subscription?.enabledAddons || [],
            currency: activeTenant.subscription?.currency || 'USD',
            autoRenew: activeTenant.subscription?.autoRenew ?? true,
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
      : activeTenant?.permissions || ['*'];

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
      isTenantPrimary: Boolean(activeTenant?.is_primary),
      permissions: userPermissions,
      mfaEnabled: isMfaRequired || Boolean(rawUser.mfa_enabled),
      status: 'active',
    };

    if (raw.access) tokenStorage.setAccessToken(raw.access);
    if (raw.refresh) tokenStorage.setRefreshToken(raw.refresh);

    // The login response omits package details; resolve the authoritative tier
    // from the authenticated tenant subscription before persisting its context.
    if (resolvedTenantId && !isPlatformAdmin) {
      try {
        const subscriptionResponse = await apiClient.get<any>('/subscriptions/current/');
        const subscription = subscriptionResponse.data?.subscription || subscriptionResponse.data;
        const resolvedPackageTier = toPackageTier(subscription?.package?.code || subscription?.package?.name);
        if (resolvedPackageTier) {
          packageTier = resolvedPackageTier;
          packageVerified = true;
        }
        if (packageTier) {
          const savedTenant = localStorage.getItem('omni_active_tenant');
          if (savedTenant) {
            const tenant = JSON.parse(savedTenant);
            tenant.subscription = {
              ...tenant.subscription,
              package: packageTier,
              billingCycle: String(subscription?.billing_cycle || tenant.subscription?.billingCycle || 'MONTHLY').toLowerCase(),
              status: String(subscription?.status || tenant.subscription?.status || 'ACTIVE').toLowerCase(),
              enabledAddons: Array.isArray(subscription?.addons)
                ? subscription.addons.map((addon: any) => String(addon.code || '').toLowerCase())
                : tenant.subscription?.enabledAddons || [],
            };
            if (packageTier === 'enterprise') tenant.verticals = ['all_verticals'];
            localStorage.setItem('omni_active_tenant', JSON.stringify(tenant));
          }
        }
      } catch (error) {
        console.warn('Could not refresh the tenant package after sign in.', error);
      }
    }

    return {
      access: raw.access || '',
      refresh: raw.refresh || '',
      user,
      mfaRequired: isMfaRequired,
      packageTier,
      packageVerified,
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
      isTenantPrimary: Boolean(activeTenant?.is_primary),
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
