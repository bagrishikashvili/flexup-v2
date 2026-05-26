import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Building2, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useActiveCompany } from '../hooks/useActiveCompany';

export function CompanySelector() {
  const { t } = useTranslation('companies');
  const navigate = useNavigate();
  const { companies, activeCompany, setActiveCompanyId } = useActiveCompany();

  if (companies.length === 0) return null;

  const handleSwitch = (companyId: string) => {
    setActiveCompanyId(companyId);
    void navigate({ to: '/app/companies/$companyId', params: { companyId } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[200px]">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{activeCompany?.name ?? t('switchCompany')}</span>
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSwitch(company.id)}
            className={company.id === activeCompany?.id ? 'bg-primary/5 text-primary' : ''}
          >
            <span className="truncate">{company.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void navigate({ to: '/app/companies/new' })}
          className="text-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('createNewCompany')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
