import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/shared/components/layout/AppShell';
import { JobPostingForm, type JobFormValues } from '@/features/jobs/components/JobPostingForm';
import { createJobPosting } from '@/features/jobs/api/jobs.api';
import { jobQueryKeys } from '@/features/jobs/api/jobs.queries';

export const Route = createFileRoute('/app/companies/$companyId/jobs/new')({
  component: NewJobPage,
});

function NewJobPage() {
  const { companyId } = Route.useParams();
  const { t } = useTranslation('jobs');
  const { t: tNav } = useTranslation('navigation');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: JobFormValues) =>
      createJobPosting(companyId, {
        categoryId: values.categoryId,
        title: values.title,
        briefing: values.briefing,
        addressLine: values.addressLine,
        city: values.city,
        country: values.country || 'GE',
        postalCode: values.postalCode || undefined,
        latitude: values.latitude ?? undefined,
        longitude: values.longitude ?? undefined,
        contactPersonName: values.contactPersonName,
        contactPersonPhone: values.contactPersonPhone,
        skillIds: values.skillIds,
        appearanceIds: values.appearanceIds,
        languageIds: values.languageIds,
      }),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all(companyId) });
      void navigate({
        to: '/app/companies/$companyId/jobs/$jobId',
        params: { companyId, jobId: job.id },
      });
    },
  });

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: tNav('jobs'), href: `/app/companies/${companyId}/jobs` },
    { label: t('create') },
  ];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {t('create')}
        </h1>
        <JobPostingForm
          onSubmit={mutation.mutateAsync}
          isLoading={mutation.isPending}
          error={mutation.error as Error | null}
        />
      </div>
    </AppShell>
  );
}
