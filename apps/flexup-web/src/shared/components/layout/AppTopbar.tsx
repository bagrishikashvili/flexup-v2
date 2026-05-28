import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { CompanySelector } from '@/features/companies/components/CompanySelector';

interface AppTopbarProps {}

export function AppTopbar() {
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
    <header className="h-14 flex items-center justify-between px-2 border-b border-border bg-background flex-shrink-0">
      <div className="flex flex-1 items-center justify-between ">
        <div>
        <CompanySelector />
        </div>
        <div className='flex items-center gap-2'>
        <LanguageSwitcher />
        <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
          <LogOut className="w-3.5 h-3.5" />
          {t('logout')}
        </Button>
        </div>
      </div>
    </header>
  );
}
