import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Building2, LogOut } from 'lucide-react';
import { CompanyCreateForm } from '@/features/companies/components/CompanyCreateForm';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import type { CompanyDetailResponse } from '@flexup/shared';

export const Route = createFileRoute('/app/onboarding/company')({
  component: CompanyOnboardingPage,
});

function CompanyOnboardingPage() {
  const { t } = useTranslation('companies');
  const navigate = useNavigate();
  const { isEmpty, isLoading, companies } = useActiveCompany();
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

  const handleSuccess = (company: CompanyDetailResponse) => {
    void navigate({
      to: '/app/companies/$companyId',
      params: { companyId: company.id },
    });
  };

  if (!isLoading && !isEmpty) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </Button>
        </div>
        <div className="w-full max-w-md text-center">
          <h2
            className="text-xl font-bold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {companies[0]?.name}
          </h2>
          <Button asChild>
            <Link to="/app">Dashboard-ზე გადასვლა</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[720px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(102,71,240,0.15), rgba(0,145,255,0.15))' }}
          >
            <Building2 className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('createFirstTitle')}
          </h1>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            {t('createFirstDescription')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-sm)]">
          <CompanyCreateForm onSuccess={handleSuccess} />
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono mt-6">
          FLEXUP © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
