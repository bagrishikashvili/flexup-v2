import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }

    if (user?.role === 'COMPANY_USER' && !user.emailVerified) {
      throw redirect({ to: '/auth/verify-gate' });
    }

    throw redirect({ to: '/dashboard' });
  },
});
