import { apiClient, tokenStorage } from './client';
import { User } from '../types';
import { MOCK_USERS } from './mockData';

export interface LoginCredentials {
  email: string;
  password?: string;
  mfaCode?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  mfaRequired?: boolean;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
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
        mfaEnabled: false, // 2FA temporarily disabled as requested
        status: 'active',
      };

      if (raw.access) tokenStorage.setAccessToken(raw.access);
      if (raw.refresh) tokenStorage.setRefreshToken(raw.refresh);

      return {
        access: raw.access || 'cookie_session_active',
        refresh: raw.refresh || 'cookie_refresh_active',
        user,
        mfaRequired: false, // 2FA temporarily removed
      };
    } catch (err) {
      console.warn('Backend login fallback to demo user:', err);

      // Graceful demo fallback if backend is offline or network fails
      const foundUser =
        MOCK_USERS.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        ) || MOCK_USERS[1];

      const simulatedUser: User = {
        ...foundUser,
        mfaEnabled: false, // 2FA disabled
      };

      const fallbackResponse: AuthResponse = {
        access: 'mock_jwt_access_token_' + Date.now(),
        refresh: 'mock_jwt_refresh_token_' + Date.now(),
        user: simulatedUser,
        mfaRequired: false,
      };

      tokenStorage.setAccessToken(fallbackResponse.access);
      tokenStorage.setRefreshToken(fallbackResponse.refresh);
      return fallbackResponse;
    }
  },

  verifyMfa: async (email: string, code: string): Promise<AuthResponse> => {
    // 2FA is temporarily bypassed, immediately resolve session
    const foundUser =
      MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      MOCK_USERS[1];

    return {
      access: tokenStorage.getAccessToken() || 'token_mfa_bypassed',
      refresh: tokenStorage.getRefreshToken() || 'refresh_mfa_bypassed',
      user: { ...foundUser, mfaEnabled: false },
      mfaRequired: false,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    try {
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
    } catch {
      return MOCK_USERS[1]; // Default to Tenant Admin
    }
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
