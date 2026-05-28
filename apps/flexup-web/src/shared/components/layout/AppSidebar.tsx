import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Home, Building2, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  disabled?: boolean;
}


function SidebarNavItem({ item }: { item: NavItem }) {
  const routerState = useRouterState();
  const isActive = routerState.location.pathname === item.to ||
    (item.to !== '/app' && routerState.location.pathname.startsWith(item.to));
  const Icon = item.icon;

  return (
    <Link to={item.to}
      className={cn(
        'flex flex-col items-center gap-.5 text-[#fff] hover:opacity-100 transition-opacity duration-200 ease-in-out min-w-0 w-full',
        isActive ? 'opacity-100' : 'opacity-80',
        item.disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <Icon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={1.5} />
      <span className={cn('text-[9px] truncate w-full text-center')}>{item.label}</span>
    </Link>
  );
}

export function AppSidebar() {
  const { t } = useTranslation('navigation');
  const { activeCompany } = useActiveCompany();

  const navItems: NavItem[] = [
    { icon: Home, label: t('home'), to: '/app' },
    { icon: Building2, label: t('companies'), to: '/app/companies' },
    {
      icon: Briefcase,
      label: t('jobs'),
      to: activeCompany ? `/app/companies/${activeCompany.id}/jobs` : '/app',
      disabled: !activeCompany,
    },
    {
      icon: Settings,
      label: t('settings'),
      to: activeCompany ? `/app/companies/${activeCompany.id}/settings` : '/app',
      disabled: !activeCompany,
    },
  ];
  // w-[77px] bg-gradient-to-b from-[#5A43D6] to-[#2B216A] h-full p-1 rounded-[7px]
  return (
    <aside className="w-[65px] bg-gradient-to-b from-[#000] to-[#000] h-full p-1 rounded-[7px]">
      <nav className="flex-1 px-1 py-3 flex flex-col gap-4 overflow-y-auto">
        {navItems.map((item, index) => (
          <SidebarNavItem key={item.to+'_'+index} item={item} />
        ))}
      </nav>
    </aside>
  );
}
