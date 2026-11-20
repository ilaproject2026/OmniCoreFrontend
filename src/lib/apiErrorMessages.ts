type ApiErrorLike = {
  code?: unknown;
  status?: unknown;
  response?: { status?: unknown; data?: any };
  message?: unknown;
};

export const getApiErrorCode = (error: unknown): string => {
  const value = error as ApiErrorLike | null;
  const body = value?.response?.data;
  return String(
    value?.code || body?.code || body?.error?.code || ''
  ).toUpperCase();
};

/** Map transport/API failures to short user-facing messages; keep raw details out of UI. */
export const getFriendlyApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string => {
  const value = error as ApiErrorLike | null;
  const status = Number(value?.status || value?.response?.status || 0);
  const code = getApiErrorCode(error);

  if (code === 'ACCOUNT_ALREADY_EXISTS' || status === 409) {
    return 'An account with this email already exists. Sign in or reset your password.';
  }
  if (code === 'TIMEOUT' || code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  if (code === 'NETWORK_ERROR' || code === 'ERR_NETWORK' || code === 'ERR_INTERNET_DISCONNECTED') {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  if (status === 429 || code === 'THROTTLED') {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (status === 400 || status === 422 || code === 'VALIDATION_ERROR') {
    return fallback || 'Some details are invalid. Check your entries and try again.';
  }
  if (status === 401 || code === 'AUTHENTICATION_REQUIRED') {
    return 'We could not authorize this request. Refresh the page and try again.';
  }
  if (status === 403 || code === 'PERMISSION_DENIED') {
    return 'This action is not available for your account.';
  }
  if (status === 404) {
    return 'The registration service could not be found. Please try again later.';
  }
  if (status === 503 || code === 'HTTP_503') {
    return 'Email delivery is temporarily unavailable. Please try again shortly.';
  }
  if (status >= 500) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }
  return fallback;
};
