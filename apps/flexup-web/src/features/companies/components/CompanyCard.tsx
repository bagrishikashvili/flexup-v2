import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Globe, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { CompanyRoleBadge } from './CompanyRoleBadge';
import type { CompanyPublicResponse } from '@flexup/shared';
import { CompanyMemberRole } from '@flexup/shared';

interface CompanyCardProps {
  company: CompanyPublicResponse;
  isActive?: boolean;
}

function CompanyAvatar({ company }: { company: CompanyPublicResponse }) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (company.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt={company.name}
        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
      style={{ background: 'var(--gradient-cool)' }}
    >
      {initials}
    </div>
  );
}

export function CompanyCard({ company, isActive }: CompanyCardProps) {
  const { t } = useTranslation('companies');

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-[#D1D5DB] transition-all flex flex-col gap-4',
        isActive ? 'border-primary/30 ring-1 ring-primary/10' : 'border-[#E5E7EB]',
      )}
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar company={company} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground truncate">{company.name}</h3>
            {!company.isActive && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" />
                {t('inactive')}
              </span>
            )}
            {company.isVerified && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                {t('verified')}
              </span>
            )}
          </div>
          {company.currentUserRole && (
            <div className="mt-1">
              <CompanyRoleBadge role={company.currentUserRole as CompanyMemberRole} />
            </div>
          )}
          {company.websiteUrl && (
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span className="truncate">{company.websiteUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to="/app/companies/$companyId"
          params={{ companyId: company.id }}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('openCompany')} →
        </Link>
      </div>
    </div>
  );
}
