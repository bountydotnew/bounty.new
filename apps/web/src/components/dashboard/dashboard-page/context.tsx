'use client';

import { createContext } from 'react';
import type { Bounty } from '@/types/dashboard';

/**
 * Dashboard Page State
 *
 * Contains all the state data for the dashboard page.
 */
export interface DashboardPageState {
  /** Bounties data */
  bounties: Bounty[];
  /** My bounties data */
  myBounties: Bounty[];
  /** Onboarding state */
  onboardingState: {
    completedStep1: boolean;
    completedStep2: boolean;
    completedStep3: boolean;
    completedStep4: boolean;
  } | null;
  /** Loading states */
  isBountiesLoading: boolean;
  isMyBountiesLoading: boolean;
  isOnboardingLoading: boolean;
  /** Error states */
  bountiesError: Error | null;
  myBountiesError: Error | null;
}

/**
 * Dashboard Page Actions
 *
 * Contains all the actions for the dashboard page.
 */
export interface DashboardPageActions {
  /** Invalidate and refetch bounties */
  refetchBounties: () => void;
  /** Invalidate and refetch my bounties */
  refetchMyBounties: () => void;
  /** Focus the task input textarea */
  focusTaskInput: () => void;
}

/**
 * Dashboard Page Meta
 *
 * Contains metadata and refs.
 */
export interface DashboardPageMeta {
  /** Task input ref */
  taskInputRef: React.RefObject<{
    focus: () => void;
  } | null>;
}

/**
 * Dashboard Page Context Value
 *
 * Combines state, actions, and meta into a single interface.
 */
export interface DashboardPageContextValue {
  state: DashboardPageState;
  actions: DashboardPageActions;
  meta: DashboardPageMeta;
}

/**
 * Dashboard Page Context
 *
 * Created with createContext for React 19+ compatibility.
 */
export const DashboardPageContext = createContext<DashboardPageContextValue | null>(null);
