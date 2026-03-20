// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  data?: any;
  /** Skip the automatic 401 refresh interceptor? */
  skipAuthRefresh?: boolean;
}

/**
 * Core fetch wrapper. Always includes credentials (cookies) 
 * so HttpOnly refresh tokens are sent automatically.
 */
async function fetchClient(endpoint: string, { data, skipAuthRefresh, ...customConfig }: FetchOptions = {}) {
  const headers = new Headers(customConfig.headers);
  
  if (data) {
    headers.set('Content-Type', 'application/json');
  }

  // Prepend API_URL if a relative path is passed
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    ...customConfig,
    headers,
    credentials: 'include', // Core requirement for our session cookies
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  // To send the RS256 Access Token, we look it up from localStorage
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(url, config);
    let responseData;
    
    // Attempt parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (response.ok) {
      return responseData;
    }

    // ── 401 Interceptor: Transparent Refresh ──
    // If the access token died but we have a refresh cookie, backend returns 401.
    // We attempt exactly ONE automatic refresh.
    if (response.status === 401 && !skipAuthRefresh && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      try {
        // Try to rotate the refresh token
        const refreshResponse = await fetchClient('/auth/refresh', {
          method: 'POST',
          skipAuthRefresh: true // prevent infinite loops
        });

        if (refreshResponse.accessToken) {
          // Success! Save new token and replay the original request
          localStorage.setItem('accessToken', refreshResponse.accessToken);
          return await fetchClient(endpoint, { data, ...customConfig, skipAuthRefresh: true });
        }
      } catch (e) {
        // Refresh failed (cookie expired, revoked, etc.)
        // Fire a custom event that the app layout can listen to, forcing a redirect to /login
        window.dispatchEvent(new Event('auth:unauthorized'));
        // Fall through to throw the original 401 error
      }
    }

    // Standard error throw
    throw new ApiError(response.status, responseData?.error || responseData?.message || 'API request failed', responseData);

  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }
}

export const api = {
  get: (endpoint: string, customConfig: FetchOptions = {}) => fetchClient(endpoint, { ...customConfig, method: 'GET' }),
  post: (endpoint: string, data?: any, customConfig: FetchOptions = {}) => fetchClient(endpoint, { ...customConfig, data, method: 'POST' }),
  put: (endpoint: string, data?: any, customConfig: FetchOptions = {}) => fetchClient(endpoint, { ...customConfig, data, method: 'PUT' }),
  patch: (endpoint: string, data?: any, customConfig: FetchOptions = {}) => fetchClient(endpoint, { ...customConfig, data, method: 'PATCH' }),
  delete: (endpoint: string, customConfig: FetchOptions = {}) => fetchClient(endpoint, { ...customConfig, method: 'DELETE' }),
};
