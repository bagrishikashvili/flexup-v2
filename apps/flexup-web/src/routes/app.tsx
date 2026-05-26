import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { UserRole } from '@flexup/shared';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { apiRequest } from '@/shared/api/client';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/app')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }

    if (user?.role === UserRole.COMPANY_USER && !user.emailVerified) {
      throw redirect({ to: '/auth/verify-gate' });
    }
  },
  component: AppLayout,
});

function WorkerBlockedScreen() {
  const { t } = useTranslation('companies');
  const navigate = useNavigate();
  const logoutStore = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    logoutStore();
    void navigate({ to: '/auth/login' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-6 text-center">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--gradient-cool)' }}
      >
        <span className="text-white text-2xl font-bold">W</span>
      </div>
      <h1
        className="text-2xl font-bold text-foreground mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('workerBlockedTitle')}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-sm">{t('workerBlockedText')}</p>
      <Button variant="outline" onClick={() => void handleLogout()}>
        {t('logout')}
      </Button>
    </div>
  );
}

function AppLayout() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === UserRole.WORKER) {
    return <WorkerBlockedScreen />;
  }

  return <Outlet />;
}
