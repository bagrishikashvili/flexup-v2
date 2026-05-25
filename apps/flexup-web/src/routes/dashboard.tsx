import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { apiRequest } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
    if (user?.role === 'COMPANY_USER' && !user.emailVerified) {
      throw redirect({ to: '/auth/verify-gate' });
    }
  },
  component: DashboardPage,
});

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', href: '/dashboard', active: true },
  { icon: CalendarDays, labelKey: 'nav.shifts', href: '/shifts' },
  { icon: Building2, labelKey: 'nav.companies', href: '/companies' },
  { icon: Users, labelKey: 'nav.workers', href: '/workers' },
];

function getInitials(firstName?: string, lastName?: string) {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}

function Sidebar({
  user,
  onLogout,
}: {
  user: { firstName?: string; lastName?: string; email?: string } | null;
  onLogout: () => void;
}) {
  const { t } = useTranslation();

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col bg-[#F9FAFB] border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex-shrink-0"
            style={{ background: 'var(--gradient-cool)' }}
          />
          <span className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            flex<span className="gradient-text">up</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} label={t(item.labelKey, item.labelKey)} />
        ))}

        <div className="mt-auto pt-3 border-t border-border">
          <NavLink
            item={{ icon: Settings, labelKey: 'nav.settings', href: '/settings' }}
            label={t('nav.settings', 'Settings')}
          />
        </div>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-black/5 transition-colors">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ background: 'var(--gradient-cool)' }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title={t('auth:logout')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, label }: { item: NavItem; label: string }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
        item.active
          ? 'bg-primary/10 text-primary border-l-[3px] border-primary pl-[7px]'
          : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-l-[3px] border-transparent pl-[7px]'
      )}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
      {label}
    </a>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold font-display text-foreground mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function DashboardPage() {
  const { t: tAuth } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore — still log out client-side
    }
    logoutStore();
    void navigate({ to: '/auth/login' });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} onLogout={() => void handleLogout()} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span>DASHBOARD</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Overview</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="w-3.5 h-3.5" />
              {tAuth('logout')}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {/* Welcome */}
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                გამარჯობა,{' '}
                <span className="gradient-text">{user?.firstName ?? '...'}</span> 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                აქ ნახავ შენი ვარდნების მიმოხილვას.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Active Shifts" value={0} sub="No open shifts" />
              <StatCard label="Workers" value={0} sub="No workers yet" />
              <StatCard label="Companies" value={0} sub="Add your first" />
              <StatCard label="Applications" value={0} sub="Pending review" />
            </div>

            {/* Getting started */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
              <p
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3"
              >
                GETTING STARTED
              </p>
              <h2
                className="text-xl font-semibold mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                დაიწყე სამუშაო
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { step: '01', title: 'შექმენი კომპანია', desc: 'დაამატე შენი ბიზნესი პლათფორმაზე' },
                  { step: '02', title: 'დაამატე ლოკაცია', desc: 'სადაც ცვლები გაიმართება' },
                  { step: '03', title: 'გამოაქვეყნე ცვლა', desc: 'და მიიღე განაცხადები' },
                  { step: '04', title: 'მართე გუნდი', desc: 'Flexpool — შენი ფავორიტი მუშები' },
                ].map(({ step, title, desc }) => (
                  <div
                    key={step}
                    className="flex gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <span
                      className="text-xs font-mono font-medium text-primary mt-0.5 flex-shrink-0"
                    >
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
