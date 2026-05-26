import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/shared/components/layout/AppShell';
import { CompanyCreateForm } from '@/features/companies/components/CompanyCreateForm';
import type { CompanyDetailResponse } from '@flexup/shared';

export const Route = createFileRoute('/app/companies/new')({
  component: NewCompanyPage,
});

function NewCompanyPage() {
  const { t } = useTranslation('companies');
  const { t: tNav } = useTranslation('navigation');
  const navigate = useNavigate();

  const handleSuccess = (company: CompanyDetailResponse) => {
    void navigate({
      to: '/app/companies/$companyId',
      params: { companyId: company.id },
    });
  };

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: t('newCompany') },
  ];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="max-w-[720px]">
        <div className="mb-6">
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('newCompany')}
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
          <CompanyCreateForm onSuccess={handleSuccess} />
        </div>
      </div>
    </AppShell>
  );
}
