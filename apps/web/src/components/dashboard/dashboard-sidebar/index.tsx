'use client';

import { DashboardSidebarProvider } from './provider';
import { ActivityCard } from './activity-card';
import { RecommendationsCard } from './recommendations-card';
import { MyBountiesCard } from './my-bounties-card';
import type { ActivityItem, Bounty, RecommendedBounty } from '@/types/dashboard';

/**
 * DashboardSidebar Compound Component
 *
 * Provides a flexible, composable API for the dashboard sidebar.
 * Following Vercel composition patterns with explicit components.
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
 *
 * <DashboardSidebar.Provider
 *   activities={activities}
 *   recommendations={recommendations}
 *   myBounties={myBounties}
 * >
 *   <DashboardSidebar.ActivityCard />
 *   <DashboardSidebar.RecommendationsCard />
 *   <DashboardSidebar.MyBountiesCard />
 * </DashboardSidebar.Provider>
 * ```
 */
export const DashboardSidebar = {
  /**
   * Provider component that wraps the sidebar with state and actions
   */
  Provider: DashboardSidebarProvider,

  /**
   * Recent activity card component
   */
  ActivityCard,

  /**
   * Recommended bounties card component
   */
  RecommendationsCard,

  /**
   * User's bounties card component
   */
  MyBountiesCard,
};

// Re-export types
export type {
  DashboardSidebarContextValue,
  DashboardSidebarState,
  DashboardSidebarActions,
  DashboardSidebarMeta,
} from './context';
