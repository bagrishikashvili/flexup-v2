import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F9FAFB]">
      <AppTopbar/>
      <div className="flex flex-1 p-2 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 p-1 lg:p-2 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
