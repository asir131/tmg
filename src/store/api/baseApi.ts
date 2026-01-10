import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Refresh token endpoint
const refreshTokenQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;

// Base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Check if this is the refresh endpoint itself - don't retry refresh calls
  const url = typeof args === 'string' ? args : args.url;
  const isRefreshEndpoint = url === 'auth/refresh';

  // First attempt with current access token
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 and we're not already refreshing and this isn't the refresh endpoint
  if (result.error && result.error.status === 401 && !isRefreshing && !isRefreshEndpoint) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      // No refresh token - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return result;
    }

    // Set flag to prevent concurrent refresh attempts
    isRefreshing = true;

    try {
      const refreshResult = await refreshTokenQuery(
        {
          url: 'auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data && typeof refreshResult.data === 'object' && 'success' in refreshResult.data) {
        const data = refreshResult.data as { success: boolean; data?: { accessToken: string }; message?: string };
        
        if (data.success && data.data?.accessToken) {
          // Store the new access token
          localStorage.setItem('accessToken', data.data.accessToken);

          // Retry the original request with the new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          const message = data.message || 'Session expired. Please login again.';
          if (message.includes('expired') || message.includes('Invalid')) {
            window.location.href = '/login';
          }
        }
      } else {
        // Invalid response format
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } catch (error) {
      // Refresh request failed - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    } finally {
      // Reset flag
      isRefreshing = false;
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Cart', 'Profile'],
  endpoints: () => ({}),
});
