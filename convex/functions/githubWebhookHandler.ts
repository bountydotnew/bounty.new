/**
 * GitHub webhook HTTP action entry point.
 *
 * This httpAction runs in the default Convex runtime (no Node.js).
 * It verifies the webhook signature using Web Crypto, then dispatches
 * to a Node.js internalAction for the actual processing.
 */
import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { verifyWebhookSignature } from '../lib/githubApp';

export const githubWebhookAction = httpAction(async (ctx, req) => {
  // 1. Read raw body
  const body = await req.text();

  // 2. Verify signature
  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const isValid = await verifyWebhookSignature(signature, body);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 3. Dispatch to Node.js action for processing
  try {
    await ctx.runAction(
      internal.functions.githubWebhookProcessor.processWebhookEvent,
      { eventJson: body }
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GitHub Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
