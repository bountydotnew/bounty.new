// Client-safe exports only
// For server-only trackAdminEvent, import from '@bounty/track/server'
export {
  track,
  trackButtonClick,
  trackPageView,
  createTracker,
  type TrackProps,
} from './client';
