import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Globe, ShieldCheck, Users, Briefcase, Settings, XCircle } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { CompanyRoleBadge } from '@/features/companies/components/CompanyRoleBadge';
import { useCompanyPermissions } from '@/features/companies/hooks/useCompanyPermissions';
import { getCompany } from '@/features/companies/api/companies.api';
import { companyQueryKeys } from '@/features/companies/api/companies.queries';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ApiError } from '@/shared/api/client';
import { CompanyMemberRole } from '@flexup/shared';

export const Route = createFileRoute('/app/companies/$companyId/')({
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { t } = useTranslation('companies');
  const { t: tNav } = useTranslation('navigation');

  const { data: company, isLoading, isError, error } = useQuery({
    queryKey: companyQueryKeys.detail(companyId),
    queryFn: () => getCompany(companyId),
    staleTime: 30_000,
  });

  const permissions = useCompanyPermissions(
    company?.currentUserRole as CompanyMemberRole | undefined,
  );

  if (isLoading) {
    return (
      <AppShell breadcrumb={[{ label: tNav('companies'), href: '/app/companies' }, { label: '...' }]}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    const isForbidden = error instanceof ApiError && error.status === 403;
    return (
      <AppShell breadcrumb={[{ label: tNav('companies'), href: '/app/companies' }]}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            {isForbidden ? t('forbiddenTitle') : t('genericError')}
          </p>
          <p className="text-muted-foreground mb-6">
            {isForbidden ? t('forbiddenText') : ''}
          </p>
          <Button asChild variant="outline">
            <Link to="/app/companies">{t('title')}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!company) return null;

  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: company.name },
  ];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)] flex items-start gap-5">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ background: 'var(--gradient-cool)' }}
            >
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {company.name}
              </h1>
              {!company.isActive && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" />
                  {t('inactive')}
                </span>
              )}
              {company.isVerified && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  {t('verified')}
                </span>
              )}
            </div>

            {company.currentUserRole && (
              <CompanyRoleBadge role={company.currentUserRole as CompanyMemberRole} />
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {company.legalName && <span>{company.legalName}</span>}
              {company.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {company.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="font-mono text-xs">{company.defaultCurrency}</span>
              <span>{t('memberCount', { count: company.memberCount })}</span>
            </div>
          </div>

          {permissions.canManage && (
            <Button asChild variant="outline" size="sm">
              <Link to="/app/companies/$companyId/settings" params={{ companyId }}>
                <Settings className="w-3.5 h-3.5" />
                {t('settings')}
              </Link>
            </Button>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            {t('quickActions')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-border p-5 shadow-[var(--shadow-xs)] opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-foreground">{t('members')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('comingSoon')}
              </p>
            </div>

            <Link
              to="/app/companies/$companyId/jobs"
              params={{ companyId }}
              className="bg-white rounded-xl border border-border p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-[#D1D5DB] transition-all block"
            >
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-foreground">{tNav('jobs')}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('quickActions')}</p>
            </Link>

            {permissions.canManage && (
              <Link
                to="/app/companies/$companyId/settings"
                params={{ companyId }}
                className="bg-white rounded-xl border border-border p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-[#D1D5DB] transition-all block"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground">{t('settings')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('generalInfo')}</p>
              </Link>
            )}
          </div>
        </div>

        {/* Info details */}
        {(company.registrationNumber || company.vatNumber || company.verifiedAt) && (
          <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {t('generalInfo')}
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {company.registrationNumber && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">{t('registrationNumber')}</dt>
                  <dd className="font-medium text-foreground">{company.registrationNumber}</dd>
                </div>
              )}
              {company.vatNumber && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">{t('vatNumber')}</dt>
                  <dd className="font-medium text-foreground">{company.vatNumber}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </AppShell>
  );
}
