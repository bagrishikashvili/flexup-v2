import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';
import { Skeleton } from '@/shared/components/ui/skeleton';

export const Route = createFileRoute('/app/')({
  component: AppIndexPage,
});

function AppIndexPage() {
  const navigate = useNavigate();
  const { companies, activeCompanyId, isLoading, isEmpty } = useActiveCompany();

  useEffect(() => {
    if (isLoading) return;

    if (isEmpty) {
      void navigate({ to: '/app/onboarding/company', replace: true });
      return;
    }

    const targetId = activeCompanyId ?? companies[0]?.id;
    if (targetId) {
      void navigate({
        to: '/app/companies/$companyId',
        params: { companyId: targetId },
        replace: true,
      });
    }
  }, [isLoading, isEmpty, activeCompanyId, companies, navigate]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <div className="w-[240px] bg-[#F9FAFB] border-r border-border" />
      <div className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
