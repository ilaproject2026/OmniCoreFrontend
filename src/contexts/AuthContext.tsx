import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession, TenantRole } from '../types';
import { authApi, LoginCredentials, RegisterPayload } from '../api/auth.api';
import { clearAllSessionData } from '../api/client';
import { clearQueryClientCache } from '../api/queryClient';

interface AuthContextType extends AuthSession {
  login: (credentials: LoginCredentials) => Promise<{ mfaRequired?: boolean; user?: User }>;
  register: (payload: RegisterPayload) => Promise<{ user?: User }>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: TenantRole | 'super_admin' | 'omnicore_admin') => void;
  pendingMfaEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omni_user_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('access_token') || localStorage.getItem('omni_access_token');
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem('refresh_token') || localStorage.getItem('omni_refresh_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingMfaEmail, setPendingMfaEmail] = useState<string | null>(null);

  // Sync token changes to storage
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('omni_access_token', accessToken);
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('omni_access_token');
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('omni_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('omni_refresh_token');
    }
  }, [refreshToken]);

  // Persist user state to avoid session loss on reload
  useEffect(() => {
    if (user) {
      localStorage.setItem('omni_user_state', JSON.stringify(user));
    } else {
      localStorage.removeItem('omni_user_state');
    }
  }, [user]);

  // Listen to custom token expiry event from apiClient
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      clearAllSessionData();
      clearQueryClientCache();
    };
    window.addEventListener('omni_auth_expired', handleExpired);
    return () => window.removeEventListener('omni_auth_expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Clear any prior cached queries and stale session states
      clearQueryClientCache();
      const res = await authApi.login(credentials);
      if (res.mfaRequired) {
        setPendingMfaEmail(credentials.email);
        return { mfaRequired: true, user: res.user };
      }
      setUser(res.user);
      setAccessToken(res.access);
      setRefreshToken(res.refresh);
      setPendingMfaEmail(null);
      return { mfaRequired: false, user: res.user };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      // Clear any prior cached queries and stale session states before registration
      clearAllSessionData();
      clearQueryClientCache();
      const res = await authApi.register(payload);
      setUser(res.user);
      setAccessToken(res.access);
      setRefreshToken(res.refresh);
      return { user: res.user };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(async (code: string) => {
    if (!pendingMfaEmail) throw new Error('No pending MFA authentication');
    setIsLoading(true);
    try {
      const res = await authApi.verifyMfa(pendingMfaEmail, code);
      setUser(res.user);
      setAccessToken(res.access);
      setRefreshToken(res.refresh);
      setPendingMfaEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, [pendingMfaEmail]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setPendingMfaEmail(null);
      clearAllSessionData();
      clearQueryClientCache();
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback((role: TenantRole | 'super_admin' | 'omnicore_admin') => {
    setUser((prev) => {
      const base: User = prev || {
        id: 'usr_active_session',
        email: localStorage.getItem('omni_org_owner_email') || 'admin@omnicore.io',
        firstName: 'OmniCore',
        lastName: 'Admin',
        status: 'active' as const,
        mfaEnabled: true,
        permissions: ['*'],
        isPlatformUser: true,
        platformRole: 'omnicore_admin',
      };

      if (role === 'super_admin' || role === 'omnicore_admin') {
        const updated: User = {
          ...base,
          isPlatformUser: true,
          platformRole: 'omnicore_admin',
          tenantRole: undefined,
          permissions: ['*'],
        };
        return updated;
      }

      const defaultPermsByRole: Record<TenantRole, string[]> = {
        customer_admin: ['*'],
        tenant_admin: ['*'],
        vertical_operator: [
          'dashboard.view',
          'fleet.view',
          'drivers.view',
          'trips.view',
          'trips.dispatch',
          'courier.view',
          'courier.dispatch',
          'shuttle.view',
          'shuttle.manage',
          'maintenance.view',
          'warehouse.view',
          'finance.view',
          'reports.view',
          'notifications.view',
        ],
        customer_staff: [
          'dashboard.view',
          'trips.view',
          'notifications.view',
        ],
      };

      const updated: User = {
        ...base,
        isPlatformUser: false,
        platformRole: undefined,
        tenantRole: role,
        permissions: defaultPermsByRole[role] || (role === 'customer_admin' || role === 'tenant_admin' ? ['*'] : []),
      };
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(user && accessToken),
        isLoading,
        pendingMfaEmail,
        login,
        register,
        verifyMfa,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
