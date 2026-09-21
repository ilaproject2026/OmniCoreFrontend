import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession, TenantRole } from '../types';
import { authApi, LoginCredentials, RegisterPayload } from '../api/auth.api';
import { tokenStorage } from '../api/client';

interface AuthContextType extends AuthSession {
  login: (credentials: LoginCredentials) => Promise<{ mfaRequired?: boolean; user?: User }>;
  register: (payload: RegisterPayload) => Promise<{ user?: User }>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: TenantRole | 'super_admin') => void;
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

  const [accessToken, setAccessToken] = useState<string | null>(tokenStorage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(tokenStorage.getRefreshToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingMfaEmail, setPendingMfaEmail] = useState<string | null>(null);

  // Validate session against backend if token exists but user state is fresh
  useEffect(() => {
    const initSession = async () => {
      const token = tokenStorage.getAccessToken();
      if (token && !user) {
        setIsLoading(true);
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          // Token expired or invalid
          setUser(null);
          tokenStorage.clearTokens();
          setAccessToken(null);
          setRefreshToken(null);
        } finally {
          setIsLoading(false);
        }
      }
    };
    initSession();
  }, []);

  // Synchronize user to localStorage
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
      tokenStorage.clearTokens();
    };
    window.addEventListener('omni_auth_expired', handleExpired);
    return () => window.removeEventListener('omni_auth_expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
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
      tokenStorage.clearTokens();
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback((role: TenantRole | 'super_admin') => {
    setUser((prev) => {
      const base = prev || {
        id: 'usr_active_session',
        email: 'admin@omnicore.io',
        firstName: 'Marcus',
        lastName: 'Sterling',
        status: 'active' as const,
        mfaEnabled: true,
        permissions: [],
      };

      if (role === 'super_admin') {
        const updated: User = {
          ...base,
          id: 'usr_super_admin',
          firstName: 'Sarang',
          lastName: 'Dev (Super Admin)',
          email: 'superadmin@omnicore.io',
          isPlatformUser: true,
          platformRole: 'super_admin',
          tenantRole: undefined,
          permissions: ['*'],
        };
        tokenStorage.setAccessToken('demo_platform_token');
        tokenStorage.setRefreshToken('demo_platform_refresh');
        setAccessToken('demo_platform_token');
        return updated;
      }

      const roleNames: Record<TenantRole, { first: string; last: string; email: string }> = {
        tenant_admin: { first: 'Marcus', last: 'Sterling (Tenant Admin)', email: 'admin@apexlogistics.com' },
        operations_manager: { first: 'David', last: 'Kowalski (Manager)', email: 'manager@apexlogistics.com' },
        fleet_manager: { first: 'Elena', last: 'Rostova (Fleet Mgr)', email: 'fleet@apexlogistics.com' },
        finance_user: { first: 'Robert', last: 'Chen (Finance Lead)', email: 'finance@apexlogistics.com' },
        hr_user: { first: 'Sarah', last: 'Connor (HR Specialist)', email: 'hr@apexlogistics.com' },
        warehouse_user: { first: 'Jamal', last: 'Vance (Warehouse Supr)', email: 'warehouse@apexlogistics.com' },
        sales_crm_user: { first: 'Jessica', last: 'Alba (Sales & CRM)', email: 'sales@apexlogistics.com' },
        driver_field_user: { first: 'Carlos', last: 'Santana (Fleet Driver)', email: 'carlos.driver@apexlogistics.com' },
      };

      const meta = roleNames[role] || { first: 'Field', last: 'User', email: 'user@apexlogistics.com' };

      const updated: User = {
        ...base,
        id: `usr_${role}`,
        firstName: meta.first,
        lastName: meta.last,
        email: meta.email,
        isPlatformUser: false,
        platformRole: undefined,
        tenantId: 'tenant_apex',
        tenantRole: role,
        permissions: role === 'tenant_admin' ? ['*'] : [],
      };

      tokenStorage.setAccessToken('demo_tenant_token');
      tokenStorage.setRefreshToken('demo_tenant_refresh');
      setAccessToken('demo_tenant_token');
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
