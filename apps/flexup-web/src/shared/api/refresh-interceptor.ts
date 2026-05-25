import { ApiError, apiRequest } from './client';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

let refreshPromise: Promise<AuthResponseWithoutRefresh> | null = null;

export async function withRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      (error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID')
    ) {
      if (!refreshPromise) {
        refreshPromise = apiRequest<AuthResponseWithoutRefresh>('/auth/refresh', {
          method: 'POST',
          skipAuth: true,
        }).finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newAuth = await refreshPromise;
        const { setAccessToken } = await import('@/features/auth/stores/auth.store');
        setAccessToken(newAuth.accessToken, newAuth.user);
        return await apiCall();
      } catch (refreshError) {
        const { logout } = await import('@/features/auth/stores/auth.store');
        logout();
        throw refreshError;
      }
    }
    throw error;
  }
}
