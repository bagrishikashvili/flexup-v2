import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Pencil, MapPin, Phone, User } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getJobPosting, setJobPostingArchived } from '@/features/jobs/api/jobs.api';
import { jobQueryKeys } from '@/features/jobs/api/jobs.queries';

export const Route = createFileRoute('/app/companies/$companyId/jobs/$jobId/')({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { companyId, jobId } = Route.useParams();
  const { t, i18n } = useTranslation('jobs');
  const { t: tNav } = useTranslation('navigation');
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: jobQueryKeys.detail(companyId, jobId),
    queryFn: () => getJobPosting(companyId, jobId),
    staleTime: 30_000,
  });

  const archiveMutation = useMutation({
    mutationFn: (isArchived: boolean) =>
      setJobPostingArchived(companyId, jobId, { isArchived }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all(companyId) });
    },
  });

  if (isLoading || !job) {
    return (
      <AppShell breadcrumb={[{ label: tNav('jobs') }]}>
        <div className="flex flex-col gap-4 max-w-2xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const categoryTitle = i18n.language === 'ka' ? job.category.titleKa : job.category.title;
  const sectionTitle = job.category.section
    ? (i18n.language === 'ka' ? job.category.section.nameKa : job.category.section.name)
    : '';

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: tNav('jobs'), href: `/app/companies/${companyId}/jobs` },
    { label: job.title },
  ];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="max-w-2xl flex flex-col gap-6">
        {job.coverPhotoUrl && (
          <img
            src={job.coverPhotoUrl}
            alt={job.title}
            className="w-full rounded-xl object-cover max-h-64"
          />
        )}

        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {job.title}
                </h1>
                {job.isArchived && (
                  <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {t('archived')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {sectionTitle && <span>{sectionTitle} · </span>}
                {categoryTitle}
                {job.category.isTippable && (
                  <span className="ml-2 text-xs text-amber-600">· {t('categoryMeta.tippable')}</span>
                )}
                {job.category.isExperienceRequired && (
                  <span className="ml-2 text-xs text-blue-600">· {t('categoryMeta.experienced')}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveMutation.mutate(!job.isArchived)}
                disabled={archiveMutation.isPending}
              >
                {job.isArchived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                {job.isArchived ? t('unarchive') : t('archive')}
              </Button>
              <Button asChild size="sm">
                <Link to="/app/companies/$companyId/jobs/$jobId/edit" params={{ companyId, jobId }}>
                  <Pencil className="w-4 h-4" />
                  {t('edit')}
                </Link>
              </Button>
            </div>
          </div>

          <p className="text-sm text-foreground whitespace-pre-wrap">{job.briefing}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)] flex flex-col gap-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            {t('form.address')}
          </p>
          <div className="flex items-start gap-2 text-sm text-foreground">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <div>{job.addressLine}</div>
              <div className="text-muted-foreground">{job.city}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {job.contactPersonName}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {job.contactPersonPhone}
          </div>
        </div>

        {(job.skills.length > 0 || job.appearances.length > 0 || job.languages.length > 0) && (
          <div className="bg-white rounded-xl border border-border p-6 shadow-[var(--shadow-xs)] flex flex-col gap-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {t('form.sections.requirements')}
            </p>
            {job.skills.length > 0 && (
              <RequirementGroup
                label={t('form.skills')}
                items={job.skills.map((s) => (i18n.language === 'ka' ? s.nameKa : s.name))}
              />
            )}
            {job.appearances.length > 0 && (
              <RequirementGroup
                label={t('form.appearance')}
                items={job.appearances.map((a) => (i18n.language === 'ka' ? a.nameKa : a.name))}
              />
            )}
            {job.languages.length > 0 && (
              <RequirementGroup
                label={t('form.languages')}
                items={job.languages.map((l) => (i18n.language === 'ka' ? l.nameKa : l.name))}
              />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function RequirementGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="text-xs px-2.5 py-1 bg-muted rounded-full text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
