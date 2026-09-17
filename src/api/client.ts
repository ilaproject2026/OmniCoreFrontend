import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API URL from environment variable or local proxy default
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface ApiErrorResponse {
  message: string;
  code: string;
  detail?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Global tokens storage helpers
export const tokenStorage = {
  getAccessToken: (): string | null =>
    localStorage.getItem('access_token') || localStorage.getItem('omni_access_token'),
  setAccessToken: (token: string): void => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('omni_access_token', token);
  },
  getRefreshToken: (): string | null =>
    localStorage.getItem('refresh_token') || localStorage.getItem('omni_refresh_token'),
  setRefreshToken: (token: string): void => {
    localStorage.setItem('refresh_token', token);
    localStorage.setItem('omni_refresh_token', token);
  },
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('omni_access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('omni_refresh_token');
  },
};

// Tenant Context Storage
export const tenantStorage = {
  getActiveTenantId: (): string | null =>
    localStorage.getItem('active_tenant_id') ||
    localStorage.getItem('omni_active_tenant_id') ||
    localStorage.getItem('omni_active_tenant'),
  setActiveTenantId: (id: string): void => {
    localStorage.setItem('active_tenant_id', id);
    localStorage.setItem('omni_active_tenant_id', id);
  },
  clearActiveTenantId: (): void => {
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('omni_active_tenant_id');
    localStorage.removeItem('omni_active_tenant');
  },
};

// Create main Axios instance with cookie credentials enabled
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for injecting JWT Bearer token and X-Tenant-ID header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Strip redundant /api/v1 if present in url since baseURL already includes it
    if (config.url?.startsWith('/api/v1/')) {
      config.url = config.url.replace('/api/v1', '');
    }

    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = tenantStorage.getActiveTenantId();
    if (tenantId && config.headers && !config.headers['X-Tenant-ID']) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with automatic envelope unwrapping and token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      const unwrapped = response.data.data;
      if (response.data.pagination && Array.isArray(unwrapped)) {
        (unwrapped as any).pagination = response.data.pagination;
      }
      response.data = unwrapped;
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent('omni_auth_expired'));
        isRefreshing = false;
        return Promise.reject(normalizeApiError(error));
      }

      try {
        // Support both official /auth/refresh/ and /auth/token/refresh/ endpoints
        let response;
        try {
          response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
        } catch {
          response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
        }

        const newAccessToken =
          response.data?.access || response.data?.data?.access;

        if (newAccessToken) {
          tokenStorage.setAccessToken(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned in refresh response');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent('omni_auth_expired'));
        return Promise.reject(normalizeApiError(refreshErr as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

// Standardized error normalization for DRF backend responses
export function normalizeApiError(error: AxiosError<any> | Error): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const status = error.response?.status;

    if (data) {
      if (typeof data === 'string') {
        return { message: data, code: 'SERVER_ERROR', status };
      }

      const message =
        data.detail ||
        data.message ||
        data.error ||
        (data.non_field_errors && data.non_field_errors[0]) ||
        `Request failed with status ${status}`;

      return {
        message,
        code: data.code || `HTTP_${status}`,
        detail: data.detail,
        errors: typeof data === 'object' ? data : undefined,
        status,
      };
    }

    if (error.code === 'ECONNABORTED') {
      return { message: 'Network request timed out. Please retry.', code: 'TIMEOUT' };
    }

    return { message: error.message || 'Network communication error', code: 'NETWORK_ERROR' };
  }

  return { message: error.message || 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
}
