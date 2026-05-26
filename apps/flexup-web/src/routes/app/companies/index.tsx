import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { CompanyCard } from '@/features/companies/components/CompanyCard';
import { CompanyEmptyState } from '@/features/companies/components/CompanyEmptyState';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const Route = createFileRoute('/app/companies/')({
  component: CompaniesListPage,
});

function CompaniesListPage() {
  const { t } = useTranslation('companies');
  const { t: tNav } = useTranslation('navigation');
  const { companies, activeCompany, isLoading, isError, refetch } = useActiveCompany();

  const breadcrumb = [{ label: tNav('companies') }];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('title')}
        </h1>
        <Button asChild size="sm">
          <Link to="/app/companies/new">
            <Plus className="w-4 h-4" />
            {t('newCompany')}
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">{t('genericError')}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && companies.length === 0 && <CompanyEmptyState />}

      {!isLoading && !isError && companies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isActive={company.id === activeCompany?.id}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
