/**
 * DashboardSidebar Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - Each card is a separate component
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * // New API with compound components (recommended)
 * import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
 *
 * <DashboardSidebar.Provider {...props}>
 *   <DashboardSidebar.ActivityCard />
 *   <DashboardSidebar.RecommendationsCard />
 *   <DashboardSidebar.MyBountiesCard />
 * </DashboardSidebar.Provider>
 *
 * // Legacy API (backward compatible)
 * import { DashboardSidebar as LegacySidebar } from '@/components/dashboard/dashboard-sidebar';
 *
 * <LegacySidebar activities={activities} recommendations={recommendations} />
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export { DashboardSidebar as DashboardSidebarCompound, LegacyDashboardSidebar as DashboardSidebar } from './dashboard-sidebar/index';
export type {
  DashboardSidebarContextValue,
  DashboardSidebarState,
  DashboardSidebarActions,
  DashboardSidebarMeta,
} from './dashboard-sidebar/index';
