import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/shared/components/layout/AppShell';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { JobPostingForm, type JobFormValues } from '@/features/jobs/components/JobPostingForm';
import { getJobPosting, updateJobPosting } from '@/features/jobs/api/jobs.api';
import { jobQueryKeys } from '@/features/jobs/api/jobs.queries';

export const Route = createFileRoute('/app/companies/$companyId/jobs/$jobId/edit')({
  component: EditJobPage,
});

function EditJobPage() {
  const { companyId, jobId } = Route.useParams();
  const { t } = useTranslation('jobs');
  const { t: tNav } = useTranslation('navigation');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: jobQueryKeys.detail(companyId, jobId),
    queryFn: () => getJobPosting(companyId, jobId),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (values: JobFormValues) =>
      updateJobPosting(companyId, jobId, {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all(companyId) });
      void navigate({
        to: '/app/companies/$companyId/jobs/$jobId',
        params: { companyId, jobId },
      });
    },
  });

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: tNav('jobs'), href: `/app/companies/${companyId}/jobs` },
    { label: job?.title ?? '...', href: `/app/companies/${companyId}/jobs/${jobId}` },
    { label: t('edit') },
  ];

  if (isLoading || !job) {
    return (
      <AppShell breadcrumb={breadcrumb}>
        <div className="flex flex-col gap-4 max-w-2xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const defaultValues: JobFormValues = {
    categoryId: job.category.id,
    title: job.title,
    briefing: job.briefing,
    addressLine: job.addressLine,
    city: job.city,
    country: job.country,
    postalCode: job.postalCode ?? '',
    latitude: job.latitude ?? undefined,
    longitude: job.longitude ?? undefined,
    contactPersonName: job.contactPersonName,
    contactPersonPhone: job.contactPersonPhone,
    skillIds: job.skills.map((s) => s.id),
    appearanceIds: job.appearances.map((a) => a.id),
    languageIds: job.languages.map((l) => l.id),
  };

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          {t('edit')}
        </h1>
        <JobPostingForm
          defaultValues={defaultValues}
          onSubmit={mutation.mutateAsync}
          isLoading={mutation.isPending}
          error={mutation.error as Error | null}
        />
      </div>
    </AppShell>
  );
}
