import { createContext } from 'react';
import type { ActivityItem, Bounty, RecommendedBounty } from '@/types/dashboard';

/**
 * DashboardSidebar State Interface
 * Contains all data needed by child components
 */
export interface DashboardSidebarState {
  /** Recent activity items */
  activities: ActivityItem[];
  /** Recommended bounties */
  recommendations: RecommendedBounty[];
  /** User's bounties */
  myBounties: Bounty[];
  /** Whether activities are loading */
  isLoadingActivities: boolean;
  /** Whether my bounties are loading */
  isLoadingMyBounties: boolean;
}

/**
 * DashboardSidebar Actions Interface
 * Contains all actions that can be performed
 */
export interface DashboardSidebarActions {
  /** Click handler for bounty clicks */
  onBountyClick?: (bounty: Bounty) => void;
}

/**
 * DashboardSidebar Meta Interface
 * Contains metadata and configuration
 */
export interface DashboardSidebarMeta {
  /** CSS class name for the container */
  className?: string;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface DashboardSidebarContextValue {
  state: DashboardSidebarState;
  actions: DashboardSidebarActions;
  meta: DashboardSidebarMeta;
}

/**
 * Context for DashboardSidebar compound components
 * Null means we're outside the provider
 */
export const DashboardSidebarContext = createContext<DashboardSidebarContextValue | null>(null);
