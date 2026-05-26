import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { CompanySelector } from '@/features/companies/components/CompanySelector';

interface AppTopbarProps {
  breadcrumb?: { label: string; href?: string }[];
}

export function AppTopbar({ breadcrumb }: AppTopbarProps) {
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
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-10 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {breadcrumb?.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={idx === breadcrumb.length - 1 ? 'text-foreground' : ''}>
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <CompanySelector />
        <LanguageSwitcher />
        <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
          <LogOut className="w-3.5 h-3.5" />
          {t('logout')}
        </Button>
      </div>
    </header>
  );
}
