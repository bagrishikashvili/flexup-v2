import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Home, Building2, Settings } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  disabled?: boolean;
}

function BrandLogo() {
  return (
    <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex-shrink-0"
          style={{ background: 'var(--gradient-cool)' }}
        />
        <span className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Flex<span className="gradient-text">Up</span>
        </span>
      </div>
    </div>
  );
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const routerState = useRouterState();
  const isActive = routerState.location.pathname === item.to ||
    (item.to !== '/app' && routerState.location.pathname.startsWith(item.to));
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className={cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium border-l-[3px] border-transparent pl-[7px]',
          'text-muted-foreground/40 cursor-not-allowed',
        )}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors border-l-[3px] pl-[7px]',
        isActive
          ? 'bg-primary/10 text-primary border-primary'
          : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-transparent',
      )}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
      {item.label}
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
      icon: Settings,
      label: t('settings'),
      to: activeCompany ? `/app/companies/${activeCompany.id}/settings` : '/app',
      disabled: !activeCompany,
    },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col bg-[#F9FAFB] border-r border-border h-screen sticky top-0">
      <BrandLogo />
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
}
