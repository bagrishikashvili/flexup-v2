import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const { t: tAuth } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore — still log out client-side
    }
    logoutStore();
    void navigate({ to: '/auth/login' });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('appName')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => void handleLogout()}>
              {tAuth('logout')}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            გამარჯობა, {user?.firstName}!
          </h2>
          <p className="text-muted-foreground">Email: {user?.email}</p>
          <p className="text-muted-foreground">Role: {user?.role}</p>
        </div>
      </div>
    </div>
  );
}
