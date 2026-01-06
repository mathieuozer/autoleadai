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
    <div className="min-h-screen pl-60">
      <main className="p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
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
