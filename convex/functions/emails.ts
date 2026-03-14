/**
 * Email functions.
 *
 * Replaces: packages/api/src/routers/emails.ts (4 procedures)
 *
 * Uses @convex-dev/resend for queued, batched, guaranteed delivery.
 */
import { query, action } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAdmin } from '../lib/auth';
import { resend, FROM_ADDRESSES, AUDIENCES } from '../email';

/**
 * Get email configuration constants.
 * Replaces: emails.constants (adminProcedure query)
 */
export const constants = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return {
      fromAddresses: FROM_ADDRESSES,
      audiences: AUDIENCES,
    };
  },
});

/**
 * Send an email.
 * Replaces: emails.send (adminProcedure mutation → action)
 */
export const send = action({
  args: {
    to: v.string(),
    subject: v.string(),
    fromKey: v.string(),
    text: v.optional(v.string()),
    html: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const from =
      FROM_ADDRESSES[args.fromKey as keyof typeof FROM_ADDRESSES] ??
      FROM_ADDRESSES.general;

    const emailId = await resend.sendEmail(ctx, {
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    return { emailId };
  },
});

/**
 * Subscribe an email to an audience.
 * Replaces: emails.subscribe (adminProcedure mutation → action)
 */
export const subscribe = action({
  args: {
    email: v.string(),
    audienceKey: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resend audience management would be done via direct Resend SDK calls
    // since the @convex-dev/resend component focuses on email sending.
    const Resend = (await import('resend')).Resend;
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    const audienceId =
      AUDIENCES[args.audienceKey as keyof typeof AUDIENCES] ?? args.audienceKey;

    await resendClient.contacts.create({
      audienceId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
    });

    return { success: true };
  },
});

/**
 * Unsubscribe an email from an audience.
 * Replaces: emails.unsubscribe (adminProcedure mutation → action)
 */
export const unsubscribe = action({
  args: {
    email: v.string(),
    audienceKey: v.string(),
  },
  handler: async (ctx, args) => {
    const Resend = (await import('resend')).Resend;
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    const audienceId =
      AUDIENCES[args.audienceKey as keyof typeof AUDIENCES] ?? args.audienceKey;

    await resendClient.contacts.remove({
      audienceId,
      email: args.email,
    });

    return { success: true };
  },
});
