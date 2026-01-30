import { ReactNode } from 'react';
import { NotificationBell } from '@/components/notifications';

interface PageContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageContainer({ children, title, subtitle, actions }: PageContainerProps) {
  return (
    <div className="min-h-screen pt-14 md:pt-0 md:pl-60">
      <main className="p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0f172a]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <NotificationBell />
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
