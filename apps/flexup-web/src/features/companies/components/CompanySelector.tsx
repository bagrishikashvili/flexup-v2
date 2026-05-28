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
        <Button variant="logo" size="sm" className="max-w-[200px]">
          {
            activeCompany?.logoUrl ? 
              <img src={activeCompany?.logoUrl || undefined} alt={activeCompany?.name} className="w-7 h-7 flex-shrink-0 rounded-full" /> 
              : 
              <div className="w-7 h-7 font-bold flex items-center justify-center flex-shrink-0 rounded-full bg-[#fff]">{activeCompany?.name?.slice(0, 2).toUpperCase()}</div>
          } 
          <span className="truncate">{activeCompany?.name ?? t('switchCompany')}</span>
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] ml-2">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSwitch(company.id)}
            className={company.id === activeCompany?.id ? 'bg-primary/5 text-primary cursor-pointer' : 'cursor-pointer'}
          >
            <Building2 className="w-1 h-1 flex-shrink-0" />
            <span className="truncate">{company.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void navigate({ to: '/app/companies/new' })}
          className="text-primary cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('createNewCompany')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
