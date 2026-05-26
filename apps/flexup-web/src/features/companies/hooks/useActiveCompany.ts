import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getMyCompanies } from '../api/companies.api';
import { companyQueryKeys } from '../api/companies.queries';
import { useCompanyStore } from '../stores/company.store';
import type { CompanyPublicResponse } from '@flexup/shared';

export function useActiveCompany() {
  const activeCompanyId = useCompanyStore((s) => s.activeCompanyId);
  const setActiveCompanyId = useCompanyStore((s) => s.setActiveCompanyId);

  const { data: companies = [], isLoading, isError, refetch } = useQuery({
    queryKey: companyQueryKeys.mine(),
    queryFn: getMyCompanies,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const activeCompany: CompanyPublicResponse | undefined =
    companies.find((c) => c.id === activeCompanyId) ?? companies[0];

  useEffect(() => {
    if (isLoading) return;
    if (companies.length === 0) {
      setActiveCompanyId(null);
      return;
    }
    if (!activeCompanyId || !companies.find((c) => c.id === activeCompanyId)) {
      setActiveCompanyId(companies[0].id);
    }
  }, [isLoading, companies, activeCompanyId, setActiveCompanyId]);

  return {
    companies,
    activeCompany,
    activeCompanyId: activeCompany?.id ?? null,
    setActiveCompanyId,
    isLoading,
    isError,
    refetch,
    isEmpty: !isLoading && companies.length === 0,
  };
}
