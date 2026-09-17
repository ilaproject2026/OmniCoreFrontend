import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession } from '../types';
import { authApi, LoginCredentials } from '../api/auth.api';
import { tokenStorage } from '../api/client';
import { MOCK_USERS } from '../api/mockData';

interface AuthContextType extends AuthSession {
  login: (credentials: LoginCredentials) => Promise<{ mfaRequired?: boolean; user?: User }>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRoleForDemo: (user: User) => void;
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
        return MOCK_USERS[1];
      }
    }
    return MOCK_USERS[1]; // Default to Tenant Admin for seamless demo
  });

  const [accessToken, setAccessToken] = useState<string | null>(tokenStorage.getAccessToken() || 'mock_token');
  const [refreshToken, setRefreshToken] = useState<string | null>(tokenStorage.getRefreshToken() || 'mock_refresh');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingMfaEmail, setPendingMfaEmail] = useState<string | null>(null);

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

  const switchUserRoleForDemo = useCallback((newUser: User) => {
    setUser(newUser);
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
        verifyMfa,
        logout,
        switchUserRoleForDemo,
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
