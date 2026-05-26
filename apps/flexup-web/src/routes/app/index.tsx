import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus } from 'lucide-react';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { AppShell } from '@/shared/components/layout/AppShell';
import { CompanyCard } from '@/features/companies/components/CompanyCard';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const Route = createFileRoute('/app/')({
  component: AppDashboardPage,
});

function AppDashboardPage() {
  const { t } = useTranslation('companies');
  const { t: tNav } = useTranslation('navigation');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { companies, activeCompany, isLoading, isEmpty } = useActiveCompany();

  useEffect(() => {
    if (!isLoading && isEmpty) {
      void navigate({ to: '/app/onboarding/company', replace: true });
    }
  }, [isLoading, isEmpty, navigate]);

  if (isLoading || isEmpty) {
    return (
      <div className="flex min-h-screen bg-[#F9FAFB]">
        <div className="w-[240px] bg-[#F9FAFB] border-r border-border" />
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const breadcrumb = [{ label: tNav('home') }];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-8">
        {/* Welcome */}
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            გამარჯობა,{' '}
            <span className="gradient-text">{user?.firstName ?? '...'}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            აქ ნახავ შენი ბიზნესის მიმოხილვას.
          </p>
        </div>

        {/* Active company highlight */}
        {activeCompany && (
          <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              ACTIVE COMPANY
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeCompany.logoUrl ? (
                  <img
                    src={activeCompany.logoUrl}
                    alt={activeCompany.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'var(--gradient-cool)' }}
                  >
                    {activeCompany.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{activeCompany.name}</p>
                  <p className="text-xs text-muted-foreground">{activeCompany.defaultCurrency}</p>
                </div>
              </div>
              <Link
                to="/app/companies/$companyId"
                params={{ companyId: activeCompany.id }}
                className="text-sm text-primary font-medium hover:underline"
              >
                {t('openCompany')} →
              </Link>
            </div>
          </div>
        )}

        {/* Companies summary */}
        {companies.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {t('title')}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/companies/new">
                  <Plus className="w-4 h-4" />
                  {t('newCompany')}
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  isActive={company.id === activeCompany?.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Getting started steps */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            GETTING STARTED
          </p>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            დაიწყე სამუშაო
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                step: '01',
                title: 'შექმენი კომპანია',
                desc: 'დაამატე შენი ბიზნესი პლათფორმაზე',
                done: companies.length > 0,
                to: '/app/companies/new' as const,
              },
              {
                step: '02',
                title: 'დაამატე ლოკაცია',
                desc: 'სადაც ცვლები გაიმართება',
                done: false,
                to: null,
              },
              {
                step: '03',
                title: 'გამოაქვეყნე ცვლა',
                desc: 'და მიიღე განაცხადები',
                done: false,
                to: null,
              },
              {
                step: '04',
                title: 'მართე გუნდი',
                desc: 'Flexpool — შენი ფავორიტი მუშები',
                done: false,
                to: null,
              },
            ].map(({ step, title, desc, done, to }) => (
              <div
                key={step}
                className={`flex gap-3 p-4 rounded-lg border transition-colors ${
                  done
                    ? 'border-[#4CAF50]/30 bg-[#4CAF50]/5'
                    : to
                      ? 'border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
                      : 'border-border opacity-50'
                }`}
              >
                <span
                  className={`text-xs font-mono font-medium mt-0.5 flex-shrink-0 ${done ? 'text-[#4CAF50]' : 'text-primary'}`}
                >
                  {done ? '✓' : step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  {to && !done && (
                    <Link
                      to={to}
                      className="text-xs text-primary font-medium hover:underline mt-1 block"
                    >
                      {step === '01' ? t('createCompany') : t('comingSoon')} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
