/**
 * Resend Webhook Handler
 *
 * Receives inbound email events from Resend.
 * Any email sent to <anything>@hecuatkra.resend.app (or a custom domain)
 * is processed by Resend and forwarded here as an `email.received` event.
 *
 * Webhook payload contains metadata only — email body and attachments
 * must be fetched separately via the Resend API.
 *
 * Setup:
 * 1. Go to https://resend.com/webhooks
 * 2. Add webhook URL: https://<your-domain>/api/webhooks/resend
 * 3. Select event: email.received
 * 4. Copy signing secret → set as RESEND_WEBHOOK_SECRET env var
 *
 * Docs: https://resend.com/docs/dashboard/receiving/introduction
 */

import { env } from '@bounty/env/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  verifyResendWebhook,
  getReceivedEmail,
  type EmailReceivedEvent,
} from '@bounty/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const webhookSecret = env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Read raw body for signature verification
    const payload = await request.text();
    const headerStore = await headers();
    const svixId = headerStore.get('svix-id');
    const svixTimestamp = headerStore.get('svix-timestamp');
    const svixSignature = headerStore.get('svix-signature');

    if (!(svixId && svixTimestamp && svixSignature)) {
      return NextResponse.json(
        { error: 'Missing webhook signature headers' },
        { status: 400 }
      );
    }

    // Verify webhook signature (throws on failure)
    const event = verifyResendWebhook({
      payload,
      svixId,
      svixTimestamp,
      svixSignature,
      webhookSecret,
    });

    // Handle email.received events
    if (event.type === 'email.received') {
      await handleEmailReceived(event as EmailReceivedEvent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error:', error);

    // Signature verification failures
    if (
      error instanceof Error &&
      (error.message.includes('Invalid') || error.message.includes('signature'))
    ) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle an inbound email received event.
 *
 * Routes based on the `to` address:
 * - support@... → Log for now (future: create support ticket)
 * - *@... → Catch-all, log the event
 *
 * To add routing logic, inspect `event.data.to` and dispatch accordingly.
 */
async function handleEmailReceived(event: EmailReceivedEvent) {
  const { email_id, from, to, subject, attachments } = event.data;

  console.log('[Resend Webhook] Email received:', {
    emailId: email_id,
    from,
    to,
    subject,
    attachmentCount: attachments.length,
  });

  // Fetch full email content (body, headers)
  // Webhook payload only contains metadata — body must be fetched separately
  try {
    const { data: emailContent, error } = await getReceivedEmail(email_id);

    if (error) {
      console.error('[Resend Webhook] Failed to fetch email content:', error);
      return;
    }

    if (emailContent) {
      console.log('[Resend Webhook] Email content fetched:', {
        emailId: email_id,
        hasHtml: !!emailContent.html,
        hasText: !!emailContent.text,
      });
    }

    // ======================================================================
    // Route based on `to` address
    // Add your routing logic here. Examples:
    //
    // const toAddresses = to.map(addr => addr.toLowerCase());
    //
    // if (toAddresses.some(a => a.startsWith('support@'))) {
    //   await handleSupportEmail(event, emailContent);
    // } else if (toAddresses.some(a => a.match(/^bounty-[\w]+@/))) {
    //   await handleBountyReply(event, emailContent);
    // }
    // ======================================================================
  } catch (err) {
    console.error('[Resend Webhook] Error processing email:', err);
  }
}
