'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardPageProvider } from '@/components/dashboard/dashboard-page';
import { DashboardContent } from './dashboard-content';
import { ErrorBoundary } from '@/components/dashboard/error-boundary';

export function DashboardClient() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <DashboardPageProvider>
          <DashboardContent />
        </DashboardPageProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
