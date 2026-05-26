import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function AppShell({ children, breadcrumb }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar breadcrumb={breadcrumb} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
