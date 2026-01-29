'use client';

import { DashboardPageProvider } from './provider';

/**
 * DashboardPage Compound Component
 *
 * Provides a provider for dashboard page state management.
 *
 * @example
 * ```tsx
 * import { DashboardPage } from '@/components/dashboard/dashboard-page';
 *
 * <DashboardPage.Provider>
 *   <YourDashboardContent />
 * </DashboardPage.Provider>
 * ```
 */
export const DashboardPage = {
  /**
   * Provider component that wraps the dashboard page with state and actions
   */
  Provider: DashboardPageProvider,
};

// Re-export types and context
export type {
  DashboardPageContextValue,
  DashboardPageState,
  DashboardPageActions,
  DashboardPageMeta,
} from './context';

// Re-export provider and context for direct usage
export { DashboardPageProvider, DashboardPageContext } from './provider';
