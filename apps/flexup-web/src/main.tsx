import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/lib/router';
import { queryClient } from '@/lib/query-client';
import '@/lib/i18n';
import '@/styles/globals.css';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { AuthResponseWithoutRefresh } from '@flexup/shared';

async function bootstrapAuth(): Promise<void> {
  try {
    const auth = await apiRequest<AuthResponseWithoutRefresh>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    useAuthStore.getState().setAuth(auth.accessToken, auth.user);
  } catch {
    // No active session — proceed unauthenticated
  }
}

bootstrapAuth().then(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element not found');

  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
