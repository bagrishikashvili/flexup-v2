import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({
      to: isAuthenticated ? '/dashboard' : '/auth/login',
    });
  },
});
