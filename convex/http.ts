/**
 * Convex HTTP router.
 *
 * Registers all HTTP action routes:
 * - Better Auth routes (/api/auth/*)
 * - Stripe webhook (/stripe/webhook)
 * - GitHub webhook (/webhooks/github)
 * - Resend webhook (/resend-webhook)
 * - RSS feeds (/feed/bounties, /feed/bounties/funded)
 */
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { registerRoutes as registerStripeRoutes } from '@convex-dev/stripe';
import { components, internal } from './_generated/api';
import { authComponent } from './auth';
import { resend } from './email';
import { createAuth } from './authConfig';

const http = httpRouter();

// ---------------------------------------------------------------------------
// Better Auth routes
// ---------------------------------------------------------------------------
authComponent.registerRoutes(http, createAuth, {
  cors: true,
});

// ---------------------------------------------------------------------------
// Stripe webhook
//
// The Stripe component handles signature verification automatically.
// Custom event handlers process bounty-specific business logic.
// ---------------------------------------------------------------------------
registerStripeRoutes(http, components.stripe, {
  webhookPath: '/stripe/webhook',
  events: {
    'checkout.session.completed': async (ctx, event) => {
      // Process bounty funding
      const session = event.data.object;
      const bountyId = session.metadata?.bountyId;
      if (!bountyId) return;

      await ctx.runMutation(
        internal.functions.bounties.handleCheckoutCompleted,
        {
          bountyId,
          stripePaymentIntentId: session.payment_intent as string,
          stripeCheckoutSessionId: session.id,
        }
      );
    },

    'payment_intent.succeeded': async (ctx, event) => {
      const pi = event.data.object;
      const bountyId = pi.metadata?.bountyId;
      if (!bountyId) return;

      await ctx.runMutation(
        internal.functions.bounties.handlePaymentIntentSucceeded,
        {
          bountyId,
          stripePaymentIntentId: pi.id,
          amountCents: BigInt(pi.amount),
        }
      );
    },

    'payment_intent.payment_failed': async (ctx, event) => {
      const pi = event.data.object;
      const bountyId = pi.metadata?.bountyId;
      if (!bountyId) return;

      await ctx.runMutation(internal.functions.bounties.handlePaymentFailed, {
        bountyId,
      });
    },

    'transfer.created': async (ctx, event) => {
      const transfer = event.data.object;
      await ctx.runMutation(internal.functions.bounties.handleTransferCreated, {
        stripeId: transfer.id,
        amountCents: BigInt(transfer.amount),
        bountyId: transfer.metadata?.bountyId,
      });
    },

    'charge.refunded': async (ctx, event) => {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent as string;
      if (!paymentIntentId) return;

      await ctx.runMutation(internal.functions.bounties.handleChargeRefunded, {
        stripePaymentIntentId: paymentIntentId,
        refundAmountCents: BigInt(charge.amount_refunded),
      });
    },
  },
});

// ---------------------------------------------------------------------------
// Resend webhook
// ---------------------------------------------------------------------------
http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

// ---------------------------------------------------------------------------
// GitHub webhook
//
// Inbound webhook from GitHub App. Verifies signature and dispatches
// to internal mutations/actions for bot commands and event processing.
// ---------------------------------------------------------------------------
import { githubWebhookAction } from './functions/githubWebhookHandler';

http.route({
  path: '/webhooks/github',
  method: 'POST',
  handler: githubWebhookAction,
});

// ---------------------------------------------------------------------------
// RSS Feeds
// ---------------------------------------------------------------------------
http.route({
  path: '/feed/bounties',
  method: 'GET',
  handler: httpAction(async (ctx, _req) => {
    const bounties = await ctx.runQuery(
      internal.functions.bounties.listOpenBountiesForFeed,
      {}
    );

    const items = bounties
      .map(
        (b: any) => `
    <item>
      <title>${escapeXml(b.title)}</title>
      <description>${escapeXml(b.description.substring(0, 500))}</description>
      <link>https://bounty.new/bounty/${b._id}</link>
      <guid>https://bounty.new/bounty/${b._id}</guid>
      <pubDate>${new Date(b._creationTime).toUTCString()}</pubDate>
    </item>`
      )
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bounty.new - Open Bounties</title>
    <link>https://bounty.new</link>
    <description>Latest open bounties on Bounty.new</description>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }),
});

// ---------------------------------------------------------------------------
// Feedback (Discord webhook)
// ---------------------------------------------------------------------------
http.route({
  path: '/feedback',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    // TODO: Port Discord webhook feedback handler
    return new Response('OK', { status: 200 });
  }),
});

export default http;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
