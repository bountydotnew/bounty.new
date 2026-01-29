/**
 * DashboardSidebar Component
 *
 * Vercel composition patterns:
 * - Compound components with shared context
 * - Each card is a separate component
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
 *
 * <DashboardSidebar.Provider {...props}>
 *   <DashboardSidebar.ActivityCard />
 *   <DashboardSidebar.RecommendationsCard />
 *   <DashboardSidebar.MyBountiesCard />
 * </DashboardSidebar.Provider>
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export { DashboardSidebar } from './dashboard-sidebar/index';
export type {
  DashboardSidebarContextValue,
  DashboardSidebarState,
  DashboardSidebarActions,
  DashboardSidebarMeta,
} from './dashboard-sidebar/index';
