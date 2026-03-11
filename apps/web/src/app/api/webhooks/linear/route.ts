import { after } from 'next/server';
import { env } from '@bounty/env/server';
import {
  getLinearWebhookHandler,
  setLastWebhookOrganizationId,
  handleAgentMention,
} from '@bounty/api/src/lib/bot';

// Bot username used for mention detection in comment bodies.
// Must match the app name in Linear for agent @mention detection.
const BOT_USERNAME = env.LINEAR_BOT_USERNAME ?? 'bountybot';

/**
 * Check if a comment body contains a mention of the bot.
 * Handles multiple formats Linear uses for @mentions:
 *   - Plain text: `@bountybot`
 *   - Bold markup: `@**bountybot**`
 *   - Link markup: `@[bountybot](mention:...)`
 *   - Agent markup: `@[bountybot](mention:app:UUID)`
 */
function commentMentionsBot(body: string): boolean {
  if (!body) return false;
  const name = BOT_USERNAME.toLowerCase();
  const lower = body.toLowerCase();
  // Plain: @bountybot
  if (lower.includes(`@${name}`)) return true;
  // Bold: @**bountybot**
  if (lower.includes(`@**${name}**`)) return true;
  // Link/agent mention: @[bountybot](mention:...)
  if (lower.includes(`@[${name}]`)) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();

    let webhookType: string | undefined;
    let webhookAction: string | undefined;
    let payload: Record<string, unknown> | undefined;
    try {
      payload = JSON.parse(body) as Record<string, unknown>;
      webhookType = payload.type as string | undefined;
      webhookAction = payload.action as string | undefined;
      if (payload.organizationId) {
        setLastWebhookOrganizationId(payload.organizationId as string);
      }
    } catch {
      // If JSON parsing fails, the adapter will handle the error
    }

    console.log(
      `[Linear Webhook] Received: type=${webhookType}, action=${webhookAction}, signature=${request.headers.has('linear-signature') ? 'present' : 'MISSING'}, body=${body.slice(0, 500)}`
    );

    // ---------------------------------------------------------------
    // Path 1: Agent mention events from Linear's OAuth app webhook
    // system (type=AppMention or similar agent session events).
    // ---------------------------------------------------------------
    if (
      webhookType === 'AppMention' ||
      webhookType === 'appMention' ||
      (payload?.data &&
        typeof payload.data === 'object' &&
        ('botMentioned' in (payload.data as Record<string, unknown>) ||
          'appMentioned' in (payload.data as Record<string, unknown>)))
    ) {
      console.log(
        '[Linear Webhook] Detected agent mention event, handling directly'
      );
      after(async () => {
        try {
          await handleAgentMention(payload!);
        } catch (err) {
          console.error('[Linear Webhook] Agent mention handler error:', err);
        }
      });
      return new Response('ok', { status: 200 });
    }

    // ---------------------------------------------------------------
    // Path 2: Standard Comment webhooks.
    //
    // The Chat SDK adapter handles these via signature verification +
    // mention detection. However, Linear may encode @mentions with
    // special markup (e.g. @[bountybot](mention:app:UUID)) that the
    // SDK's regex `/@bountybot\b/i` won't match.
    //
    // As a safety net: if this is a Comment/create webhook and the
    // body mentions the bot, also fire handleAgentMention directly.
    // The createBountyFromMention function is idempotent (checks for
    // existing bounty before creating), so duplicate processing is safe.
    // ---------------------------------------------------------------
    const data = payload?.data as Record<string, unknown> | undefined;
    const commentBody = data?.body as string | undefined;

    if (
      webhookType === 'Comment' &&
      webhookAction === 'create' &&
      commentBody &&
      commentMentionsBot(commentBody)
    ) {
      console.log(
        '[Linear Webhook] Comment contains bot mention, handling via direct path'
      );
      after(async () => {
        try {
          await handleAgentMention(payload!);
        } catch (err) {
          console.error(
            '[Linear Webhook] Comment mention handler error:',
            err
          );
        }
      });
      // Still return 200 immediately — don't also run the SDK path
      // since we're handling it directly. This avoids double-processing
      // and potential signature verification issues.
      return new Response('ok', { status: 200 });
    }

    // ---------------------------------------------------------------
    // Path 3: All other webhook events — pass through to Chat SDK.
    // This handles non-mention comments, reactions, etc.
    // ---------------------------------------------------------------
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });

    const handler = getLinearWebhookHandler();
    const response = await handler(newRequest, {
      waitUntil: (task) => after(task),
    });

    console.log(`[Linear Webhook] Response: ${response.status}`);
    return response;
  } catch (error) {
    console.error('[Linear Webhook] Handler error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
