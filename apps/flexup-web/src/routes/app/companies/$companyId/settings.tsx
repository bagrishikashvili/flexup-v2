import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { CompanyEditForm } from '@/features/companies/components/CompanyEditForm';
import { CompanyLogoUploader } from '@/features/companies/components/CompanyLogoUploader';
import { useCompanyPermissions } from '@/features/companies/hooks/useCompanyPermissions';
import { useCompanyStore } from '@/features/companies/stores/company.store';
import { getCompany, deactivateCompany } from '@/features/companies/api/companies.api';
import { companyQueryKeys } from '@/features/companies/api/companies.queries';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ApiError } from '@/shared/api/client';
import { toast } from 'sonner';
import { CompanyMemberRole } from '@flexup/shared';

export const Route = createFileRoute('/app/companies/$companyId/settings')({
  component: CompanySettingsPage,
});

function CompanySettingsPage() {
  const { companyId } = Route.useParams();
  const { t } = useTranslation('companies');
  const { t: tNav } = useTranslation('navigation');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeCompanyId = useCompanyStore((s) => s.activeCompanyId);
  const clearActiveCompany = useCompanyStore((s) => s.clearActiveCompany);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const { data: company, isLoading, isError, error } = useQuery({
    queryKey: companyQueryKeys.detail(companyId),
    queryFn: () => getCompany(companyId),
    staleTime: 30_000,
  });

  const permissions = useCompanyPermissions(
    company?.currentUserRole as CompanyMemberRole | undefined,
  );

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCompany(companyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine() });
      queryClient.removeQueries({ queryKey: companyQueryKeys.detail(companyId) });
      if (activeCompanyId === companyId) {
        clearActiveCompany();
      }
      toast.success(t('companyDeactivated'));
      void navigate({ to: '/app/companies' });
    },
    onError: (err) => {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN_ERROR';
      toast.error(tErrors(code, { defaultValue: t('genericError') }));
    },
  });

  if (isLoading) {
    return (
      <AppShell
        breadcrumb={[
          { label: tNav('companies'), href: '/app/companies' },
          { label: '...' },
          { label: t('settings') },
        ]}
      >
        <div className="flex flex-col gap-6 max-w-[720px]">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
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
          <p className="text-muted-foreground mb-6">{isForbidden ? t('forbiddenText') : ''}</p>
          <Button asChild variant="outline">
            <Link to="/app/companies">{t('title')}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!company) return null;

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: company.name, href: `/app/companies/${companyId}` },
    { label: t('settings') },
  ];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6 max-w-[720px]">
        {/* General info */}
        <section className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            {t('generalInfo')}
          </p>
          {permissions.canManage ? (
            <CompanyEditForm company={company} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('forbiddenText')}
            </p>
          )}
        </section>

        {/* Logo */}
        {permissions.canManage && (
          <section className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              {t('logo')}
            </p>
            <CompanyLogoUploader company={company} />
          </section>
        )}

        {/* Danger zone */}
        {permissions.canOwn && (
          <section className="bg-white rounded-xl border border-[#E50000]/30 p-6 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-mono uppercase tracking-widest text-[#E50000] mb-4">
              {t('dangerZone')}
            </p>

            {!showDeactivateConfirm ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('deactivateCompany')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('deactivateConfirmText')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 flex-shrink-0"
                  onClick={() => setShowDeactivateConfirm(true)}
                >
                  {t('deactivateCompany')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 p-4 bg-[#E50000]/5 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-[#E50000] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{t('deactivateConfirmText')}</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeactivateConfirm(false)}
                    disabled={deactivateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deactivateMutation.mutate()}
                    disabled={deactivateMutation.isPending}
                  >
                    {deactivateMutation.isPending ? '...' : t('deactivateConfirm')}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
