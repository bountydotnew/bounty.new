'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardPageProvider } from '@/components/dashboard/dashboard-page';
import { DashboardContent } from './dashboard-content';
import { ErrorBoundary } from '@/components/dashboard/error-boundary';

interface DashboardClientProps {
  initialAllBounties?: unknown;
}

export function DashboardClient({ initialAllBounties }: DashboardClientProps) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <DashboardPageProvider initialAllBounties={initialAllBounties}>
          <DashboardContent />
        </DashboardPageProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
