import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          import('@/features/auth/stores/auth.store').then(({ logout }) => {
            logout();
          }).catch(() => undefined);
        }
      },
    },
  },
});
