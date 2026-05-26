import { useTranslation } from 'react-i18next';
import { CompanyMemberRole } from '@flexup/shared';
import { cn } from '@/shared/utils/cn';

interface CompanyRoleBadgeProps {
  role: CompanyMemberRole;
  className?: string;
}

const roleStyle: Record<CompanyMemberRole, string> = {
  [CompanyMemberRole.OWNER]: 'bg-[#6647F0]/10 text-[#6647F0]',
  [CompanyMemberRole.MANAGER]: 'bg-[#0091FF]/10 text-[#0091FF]',
  [CompanyMemberRole.VIEWER]: 'bg-muted text-muted-foreground',
};

const roleKey: Record<CompanyMemberRole, string> = {
  [CompanyMemberRole.OWNER]: 'owner',
  [CompanyMemberRole.MANAGER]: 'manager',
  [CompanyMemberRole.VIEWER]: 'viewer',
};

export function CompanyRoleBadge({ role, className }: CompanyRoleBadgeProps) {
  const { t } = useTranslation('companies');
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide',
        roleStyle[role],
        className,
      )}
    >
      {t(roleKey[role])}
    </span>
  );
}
