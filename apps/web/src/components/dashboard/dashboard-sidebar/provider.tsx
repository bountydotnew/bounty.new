'use client';

import { useMemo, ReactNode } from 'react';
import {
  DashboardSidebarContext,
  type DashboardSidebarContextValue,
  type DashboardSidebarState,
  type DashboardSidebarActions,
  type DashboardSidebarMeta,
} from './context';
import type { ActivityItem, Bounty, RecommendedBounty } from '@/types/dashboard';

interface DashboardSidebarProviderProps {
  children: ReactNode;
  /** Recent activity items */
  activities?: ActivityItem[];
  /** Recommended bounties */
  recommendations?: RecommendedBounty[];
  /** User's bounties */
  myBounties?: Bounty[];
  /** Whether activities are loading */
  isLoadingActivities?: boolean;
  /** Whether my bounties are loading */
  isLoadingMyBounties?: boolean;
  /** Click handler for bounty clicks */
  onBountyClick?: (bounty: Bounty) => void;
  /** CSS class name for the container */
  className?: string;
}

/**
 * DashboardSidebar Provider
 *
 * Wraps the sidebar with state and actions following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <DashboardSidebarProvider
 *   activities={activities}
 *   recommendations={recommendations}
 *   myBounties={myBounties}
 * >
 *   <DashboardSidebar.ActivityCard />
 *   <DashboardSidebar.RecommendationsCard />
 *   <DashboardSidebar.MyBountiesCard />
 * </DashboardSidebarProvider>
 * ```
 */
export function DashboardSidebarProvider({
  children,
  activities = [],
  recommendations = [],
  myBounties = [],
  isLoadingActivities = false,
  isLoadingMyBounties = false,
  onBountyClick,
  className = '',
}: DashboardSidebarProviderProps) {
  // State object
  const state: DashboardSidebarState = useMemo(
    () => ({
      activities,
      recommendations,
      myBounties,
      isLoadingActivities,
      isLoadingMyBounties,
    }),
    [activities, recommendations, myBounties, isLoadingActivities, isLoadingMyBounties]
  );

  // Actions object
  const actions: DashboardSidebarActions = useMemo(
    () => ({
      onBountyClick,
    }),
    [onBountyClick]
  );

  // Meta object
  const meta: DashboardSidebarMeta = useMemo(
    () => ({
      className,
    }),
    [className]
  );

  const contextValue: DashboardSidebarContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <DashboardSidebarContext.Provider value={contextValue}>
      {children}
    </DashboardSidebarContext.Provider>
  );
}
