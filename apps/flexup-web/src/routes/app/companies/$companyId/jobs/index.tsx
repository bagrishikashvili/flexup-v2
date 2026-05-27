import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Briefcase, Archive, ArchiveRestore, Trash2, Pencil } from 'lucide-react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { getJobPostings, setJobPostingArchived, deleteJobPosting } from '@/features/jobs/api/jobs.api';
import { jobQueryKeys } from '@/features/jobs/api/jobs.queries';
import type { JobPostingListItemResponse } from '@flexup/shared';

export const Route = createFileRoute('/app/companies/$companyId/jobs/')({
  component: JobsListPage,
});

function JobsListPage() {
  const { companyId } = Route.useParams();
  const { t } = useTranslation('jobs');
  const { t: tNav } = useTranslation('navigation');
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: jobQueryKeys.list(companyId, { isArchived: showArchived }),
    queryFn: () => getJobPostings(companyId, { isArchived: showArchived }),
    staleTime: 30_000,
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      setJobPostingArchived(companyId, id, { isArchived }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all(companyId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJobPosting(companyId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobQueryKeys.all(companyId) });
    },
  });

  const breadcrumb = [
    { label: tNav('companies'), href: '/app/companies' },
    { label: tNav('jobs') },
  ];

  const jobs = data?.data ?? [];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              {t('title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived((v) => !v)}
            >
              {showArchived ? t('hideArchived') : t('showArchived')}
            </Button>
            <Button asChild size="sm">
              <Link to="/app/companies/$companyId/jobs/new" params={{ companyId }}>
                <Plus className="w-4 h-4" />
                {t('create')}
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-4" strokeWidth={1} />
            <p className="text-base font-semibold text-foreground mb-1">{t('noJobs')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('noJobsHint')}</p>
            <Button asChild>
              <Link to="/app/companies/$companyId/jobs/new" params={{ companyId }}>
                <Plus className="w-4 h-4" />
                {t('create')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                companyId={companyId}
                onArchive={(isArchived) => archiveMutation.mutate({ id: job.id, isArchived })}
                onDelete={() => {
                  if (window.confirm(t('deleteConfirm'))) {
                    deleteMutation.mutate(job.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function JobCard({
  job,
  companyId,
  onArchive,
  onDelete,
}: {
  job: JobPostingListItemResponse;
  companyId: string;
  onArchive: (isArchived: boolean) => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation('jobs');
  const categoryTitle = i18n.language === 'ka' ? job.categoryTitleKa : job.categoryTitle;

  return (
    <div className="bg-white rounded-xl border border-border shadow-[var(--shadow-xs)] overflow-hidden flex flex-col">
      {job.coverPhotoUrl ? (
        <img
          src={job.coverPhotoUrl}
          alt={job.title}
          className="w-full h-32 object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-full h-32 flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--gradient-cool)' }}
        >
          <Briefcase className="w-8 h-8 text-white/60" strokeWidth={1} />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{categoryTitle}</p>
            <p className="text-xs text-muted-foreground">{job.city}</p>
          </div>
          {job.isArchived && (
            <span className="flex-shrink-0 text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {t('archived')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border">
          <Button asChild variant="outline" size="sm" className="h-7 text-xs flex-1">
            <Link to="/app/companies/$companyId/jobs/$jobId" params={{ companyId, jobId: job.id }}>
              <Pencil className="w-3 h-3" />
              {t('edit')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onArchive(!job.isArchived)}
            title={job.isArchived ? t('unarchive') : t('archive')}
          >
            {job.isArchived ? (
              <ArchiveRestore className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onDelete}
            title={t('delete')}
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
