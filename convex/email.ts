/**
 * Email integration via @convex-dev/resend.
 *
 * Handles queuing, batching, rate limiting, and guaranteed delivery
 * of transactional emails. Replaces packages/email/.
 */
import { Resend } from '@convex-dev/resend';
import { components, internal } from './_generated/api';

/**
 * Resend email client.
 *
 * IMPORTANT: Set `testMode: false` in production!
 * In test mode, emails are queued but not actually sent.
 */
export const resend = new Resend(components.resend, {
  // testMode defaults to true — set to false for production
  testMode: process.env.NODE_ENV !== 'production',
});

// ---------------------------------------------------------------------------
// Email sending helpers
// ---------------------------------------------------------------------------

/**
 * From addresses for different email types.
 */
export const FROM_ADDRESSES = {
  notifications: 'Bounty.new <notifications@mail.bounty.new>',
  support: 'Bounty.new Support <support@mail.bounty.new>',
  marketing: 'Bounty.new <hi@mail.bounty.new>',
  general: 'Bounty.new <grim@mail.bounty.new>',
} as const;

/**
 * Resend audience IDs.
 */
export const AUDIENCES = {
  marketing: 'be47467f-19a3-401e-bab5-f94ac3822bfe',
} as const;
