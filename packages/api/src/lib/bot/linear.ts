import { Chat, type Adapter, type WebhookOptions } from 'chat';
import {
  createLinearAdapter,
  type LinearAdapter,
  type LinearRawMessage,
} from '@chat-adapter/linear';
import { createPostgresState } from '@chat-adapter/state-pg';
import { db, bounty, linearAccount, account } from '@bounty/db';
import { eq, and } from 'drizzle-orm';
import { env } from '@bounty/env/server';
import { createLinearDriver } from '../../../driver/linear-client';

// ---------------------------------------------------------------------------
// Amount parsing regex (hoisted to module scope for perf)
// ---------------------------------------------------------------------------

const AMOUNT_REGEX = /\$?(\d+(?:\.\d{1,2})?)/;

// ---------------------------------------------------------------------------
// Workaround: the adapter hardcodes raw.organizationId to undefined.
// The webhook route extracts it from the payload and stashes it here so the
// mention handler can read it synchronously (same request context).
// ---------------------------------------------------------------------------

let _lastWebhookOrgId: string | null = null;

export function setLastWebhookOrganizationId(orgId: string): void {
  _lastWebhookOrgId = orgId;
}

function parseAmount(text: string): number | null {
  const match = AMOUNT_REGEX.exec(text);
  if (!match?.[1]) {
    return null;
  }
  const parsed = Number.parseFloat(match[1]);
  return parsed > 0 ? parsed : null;
}

// ---------------------------------------------------------------------------
// Strip Linear's mention markup to get plain text.
// Linear encodes @mentions as `@**name**` or `@[name](mention:...)`.
// The Chat SDK's detectMention looks for `/@bountybot\b/i` in plain text,
// so we need the plain form in the message body for detection to work.
// ---------------------------------------------------------------------------

function stripMentionMarkup(body: string): string {
  // @**name** → @name
  let text = body.replace(/@\*\*([^*]+)\*\*/g, '@$1');
  // @[name](mention:...) → @name
  text = text.replace(/@\[([^\]]+)\]\(mention:[^)]*\)/g, '@$1');
  return text;
}

// ---------------------------------------------------------------------------
// Token refresh -- used for fetching issue data via the user's OAuth token.
// The bot's own writes go through the adapter's client credentials token.
// ---------------------------------------------------------------------------

interface OAuthAccount {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
}

async function getValidAccessToken(
  oauthAccount: OAuthAccount
): Promise<string> {
  if (!oauthAccount.accessToken) {
    throw new Error('No access token available');
  }

  const expiresAt = oauthAccount.accessTokenExpiresAt;
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  const isExpired =
    expiresAt && new Date(expiresAt).getTime() < Date.now() + bufferTime;

  if (!isExpired) {
    return oauthAccount.accessToken;
  }

  if (!oauthAccount.refreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('[Linear Bot] Refreshing access token...');

  const response = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: oauthAccount.refreshToken,
      client_id: env.LINEAR_CLIENT_ID ?? '',
      client_secret: env.LINEAR_CLIENT_SECRET ?? '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Linear Bot] Token refresh failed:', errorText);
    throw new Error('Failed to refresh Linear token');
  }

  const tokenData = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await db
    .update(account)
    .set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? oauthAccount.refreshToken,
      accessTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(account.id, oauthAccount.id));

  return tokenData.access_token;
}

// ---------------------------------------------------------------------------
// Singleton Chat instance -- lazy-initialized on first use
// ---------------------------------------------------------------------------

type BotChat = Chat & {
  webhooks: {
    linear: (req: Request, opts?: WebhookOptions) => Promise<Response>;
  };
};

let chatInstance: BotChat | null = null;
let linearAdapterRef: LinearAdapter | null = null;

function getChat(): BotChat {
  if (chatInstance) {
    return chatInstance;
  }

  // Use the dedicated bot OAuth app for the adapter. This app has its own
  // identity in Linear -- comments posted via its client credentials token
  // are attributed to the bot, not to a user.
  const botClientId = env.LINEAR_BOT_CLIENT_ID;
  const botClientSecret = env.LINEAR_BOT_CLIENT_SECRET;
  const webhookSecret = env.LINEAR_WEBHOOK_SECRET;

  // The userName MUST match the bot's display name in Linear exactly.
  // The Chat SDK uses `/@<userName>\b/i` to detect mentions in comment text.
  // If the app is called "bountybot" in Linear, userName must be "bountybot".
  const botUserName = env.LINEAR_BOT_USERNAME ?? 'bountybot';

  console.log(
    `[Linear Bot] Initializing with userName="${botUserName}", clientId=${botClientId ? 'set' : 'unset'}, webhookSecret=${webhookSecret ? 'set' : 'unset'}`
  );

  const adapter =
    botClientId && botClientSecret
      ? createLinearAdapter({
          clientId: botClientId,
          clientSecret: botClientSecret,
          userName: botUserName,
          ...(webhookSecret ? { webhookSecret } : {}),
        })
      : createLinearAdapter({
          userName: botUserName,
          ...(webhookSecret ? { webhookSecret } : {}),
        });

  linearAdapterRef = adapter;

  // Cast to work around exactOptionalPropertyTypes mismatch on botUserId
  const chat = new Chat({
    userName: botUserName,
    adapters: { linear: adapter as unknown as Adapter },
    state: createPostgresState({ url: process.env.DATABASE_URL ?? '' }),
    logger: 'info',
  }) as BotChat;

  chatInstance = chat;

  // ------------------------------------------------------------------
  // @mention handler -- someone wrote `@bountybot` or `@bountybot $500`
  //
  // The bot's own OAuth app client credentials token handles posting
  // comments back to Linear via thread.post(). The workspace's user
  // OAuth token is only used for reading issue data.
  // ------------------------------------------------------------------
  chat.onNewMention(async (thread, message) => {
    try {
      const text = message.text ?? '';
      const raw = message.raw as LinearRawMessage | undefined;

      console.log(
        `[Linear Bot] Mention received — thread=${thread.id}, text=${JSON.stringify(text.slice(0, 200))}`
      );
      // The adapter hardcodes raw.organizationId to undefined, so fall back
      // to the value stashed by the webhook route before the adapter ran.
      const organizationId = raw?.organizationId ?? _lastWebhookOrgId;

      // Decode the thread ID to get the issueId
      if (!linearAdapterRef) {
        console.error('[Linear Bot] Adapter not initialized');
        return;
      }
      const { issueId } = linearAdapterRef.decodeThreadId(thread.id);

      const reply = async (msg: string) => {
        await thread.post(msg);
      };

      await createBountyFromMention({
        issueId,
        organizationId: organizationId ?? null,
        text,
        reply,
      });
    } catch (error) {
      console.error('[Linear Bot] Error handling @mention:', error);
      try {
        await thread.post(
          'something broke on my end. check the bounty.new logs or try again.'
        );
      } catch {
        // Can't reply at all -- just log
      }
    }
  });

  return chat;
}

// ---------------------------------------------------------------------------
// Core bounty-creation logic shared between:
//   1. Chat SDK onNewMention handler (standard Comment webhooks)
//   2. handleAgentMention (Linear agent session events)
// ---------------------------------------------------------------------------

interface MentionContext {
  issueId: string;
  organizationId: string | null;
  text: string;
  reply: (message: string) => Promise<void>;
}

async function createBountyFromMention(ctx: MentionContext): Promise<void> {
  const { issueId, organizationId, text, reply } = ctx;

  if (!organizationId) {
    console.error(
      '[Linear Bot] No organizationId in webhook payload for issue',
      issueId
    );
    return;
  }

  // Parse optional amount from the mention text
  const amount = parseAmount(text);

  // Find the linear_account row for this workspace
  const [workspace] = await db
    .select()
    .from(linearAccount)
    .where(
      and(
        eq(linearAccount.linearWorkspaceId, organizationId),
        eq(linearAccount.isActive, true)
      )
    )
    .limit(1);

  if (!workspace) {
    await reply(
      "this Linear workspace isn't connected to any team on bounty.new yet. connect it first in settings > integrations."
    );
    return;
  }

  // Get the OAuth account for the linked user (for reading issue data)
  const [oauthAccount] = await db
    .select()
    .from(account)
    .where(eq(account.id, workspace.accountId))
    .limit(1);

  if (!oauthAccount?.accessToken) {
    await reply(
      'the Linear connection for this workspace has expired. someone on the team needs to reconnect it in settings.'
    );
    return;
  }

  // Fetch full issue data using the user's token (read-only)
  const accessToken = await getValidAccessToken(oauthAccount);
  const driver = createLinearDriver(accessToken);
  const issue = await driver.getIssue(issueId);

  if (!issue) {
    await reply(
      "couldn't fetch this issue's details from Linear. weird -- try again?"
    );
    return;
  }

  // Check if a bounty already exists for this issue
  const [existingBounty] = await db
    .select({ id: bounty.id })
    .from(bounty)
    .where(eq(bounty.linearIssueId, issueId))
    .limit(1);

  if (existingBounty) {
    const existingUrl = buildBountyUrl(
      workspace.organizationId ?? '',
      existingBounty.id
    );
    await reply(`there's already a bounty for this issue: ${existingUrl}`);
    return;
  }

  // Insert draft bounty directly into DB
  const [newBounty] = await db
    .insert(bounty)
    .values({
      title: issue.title,
      description: issue.description ?? '',
      amount: amount?.toString() ?? '0',
      currency: 'USD',
      status: 'draft',
      paymentStatus: 'pending',
      linearIssueId: issue.id,
      linearIssueIdentifier: issue.identifier,
      linearIssueUrl: issue.url,
      linearAccountId: workspace.id,
      organizationId: workspace.organizationId ?? '',
      createdById: oauthAccount.userId,
    })
    .returning({ id: bounty.id });

  if (!newBounty) {
    await reply(
      'something went wrong creating the bounty. try again or create it manually on bounty.new.'
    );
    return;
  }

  const bountyUrl = buildBountyUrl(
    workspace.organizationId ?? '',
    newBounty.id
  );

  // Reply in the Linear thread via the bot's client credentials token
  if (amount && amount > 0) {
    await reply(
      `got it. setting up a $${amount} bounty for this issue on bounty.new. i'll drop a link here once it's ready for you to review.\n\n${bountyUrl}`
    );
  } else {
    await reply(
      `got it. setting this up as a bounty on bounty.new. you'll need to set a price before it goes live. i'll drop a link here once it's ready.\n\n${bountyUrl}`
    );
  }

  console.log(
    `[Linear Bot] Created bounty ${newBounty.id} from Linear issue ${issue.identifier}`
  );
}

// ---------------------------------------------------------------------------
// postLinearUpdate -- fire-and-forget comment on a Linear issue
//
// Uses the bot's client credentials token via adapter.postMessage().
// Called from webhook handlers (Stripe, GitHub) and the bounties router
// when lifecycle events happen. Does NOT require a user session.
// ---------------------------------------------------------------------------

export async function postLinearUpdate(
  linearIssueId: string,
  message: string
): Promise<void> {
  try {
    // Ensure the Chat singleton (and adapter) are initialized
    getChat();

    if (!linearAdapterRef) {
      console.warn('[Linear Bot] Adapter not initialized, skipping update');
      return;
    }

    // Build an issue-level thread ID and post via the bot's own token
    const threadId = linearAdapterRef.encodeThreadId({
      issueId: linearIssueId,
    });
    await linearAdapterRef.postMessage(threadId, message);

    console.log(`[Linear Bot] Posted update to issue ${linearIssueId}`);
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('[Linear Bot] Failed to post update:', error);
  }
}

// ---------------------------------------------------------------------------
// Webhook handler -- returns the Chat SDK's built-in webhook handler
// ---------------------------------------------------------------------------

export function getLinearWebhookHandler() {
  const chat = getChat();
  return (request: Request, options?: WebhookOptions) =>
    chat.webhooks.linear(request, options);
}

// ---------------------------------------------------------------------------
// Bot install URL -- generates the actor=app OAuth URL for workspace admins
// ---------------------------------------------------------------------------

export function getLinearBotInstallUrl(redirectPath: string): string | null {
  const botClientId = env.LINEAR_BOT_CLIENT_ID;
  if (!botClientId) {
    return null;
  }
  const redirectUri = `${env.BETTER_AUTH_URL}/api/webhooks/linear/install`;
  const params = new URLSearchParams({
    client_id: botClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read,write,comments:create,issues:create,app:mentionable',
    actor: 'app',
    state: redirectPath,
  });
  return `https://linear.app/oauth/authorize?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// handleAgentMention -- direct handler for Linear agent @mention events.
//
// When the bountybot OAuth app is configured as an agent with
// `app:mentionable`, @mentions can be delivered as agent session events
// rather than standard Comment webhooks. This handler processes those
// events directly, bypassing the Chat SDK's webhook signature verification
// and mention detection (which expects standard Comment payloads).
//
// It also serves as a fallback for standard Comment webhooks where the
// mention text format doesn't match the Chat SDK's regex.
// ---------------------------------------------------------------------------

export async function handleAgentMention(
  payload: Record<string, unknown>
): Promise<void> {
  try {
    // Ensure the adapter is initialized so we can post replies
    getChat();

    console.log(
      '[Linear Bot] handleAgentMention called with payload keys:',
      Object.keys(payload)
    );

    // Extract fields from various possible payload shapes.
    // Linear agent events can come in different formats depending on
    // whether they're Comment-type events or app-specific events.
    const organizationId =
      (payload.organizationId as string) ?? _lastWebhookOrgId;

    // The issue and comment data may be nested under `data`
    const data = (payload.data ?? payload) as Record<string, unknown>;

    // Try to get issueId from various locations in the payload
    const issueId =
      (data.issueId as string) ??
      (data.issue_id as string) ??
      ((data.issue as Record<string, unknown> | undefined)?.id as string);

    if (!issueId) {
      console.error(
        '[Linear Bot] Agent mention payload missing issueId:',
        JSON.stringify(payload).slice(0, 500)
      );
      return;
    }

    // Try to get comment body from various locations
    const commentBody =
      (data.body as string) ??
      (data.commentBody as string) ??
      (data.comment_body as string) ??
      ((data.comment as Record<string, unknown> | undefined)?.body as string) ??
      '';
    const text = stripMentionMarkup(commentBody);
    const commentId =
      (data.id as string) ??
      (data.commentId as string) ??
      ((data.comment as Record<string, unknown> | undefined)?.id as string);

    console.log(
      `[Linear Bot] Agent mention: issueId=${issueId}, orgId=${organizationId}, text=${text.slice(0, 200)}, commentId=${commentId}`
    );

    // Build a reply function that posts via the adapter directly
    const reply = async (message: string) => {
      if (!linearAdapterRef) {
        console.error('[Linear Bot] Adapter not initialized, cannot reply');
        return;
      }
      // Reply under the comment thread if we have a commentId,
      // otherwise post a top-level comment on the issue.
      const threadId = commentId
        ? linearAdapterRef.encodeThreadId({ issueId, commentId })
        : linearAdapterRef.encodeThreadId({ issueId });
      await linearAdapterRef.postMessage(threadId, message);
    };

    await createBountyFromMention({
      issueId,
      organizationId: organizationId ?? null,
      text,
      reply,
    });
  } catch (error) {
    console.error('[Linear Bot] handleAgentMention error:', error);
  }
}

// ---------------------------------------------------------------------------
// Linear update message templates (lowercase, no emoji, like a teammate)
// ---------------------------------------------------------------------------

export const LINEAR_BOT_MESSAGES = {
  bountyFunded: (url: string) =>
    `bounty is live. developers can pick it up here: ${url}`,

  submissionReceived: (url: string) =>
    `someone picked this up and submitted a fix. you can review it here: ${url}`,

  bountyApproved: (url: string) =>
    `submission approved. once the PR merges, the developer gets paid. ${url}`,

  bountyCompleted: (url: string) =>
    `this one's done. fix is merged and the developer got paid. ${url}`,

  bountyCancelled: (url: string) => `bounty was cancelled. ${url}`,
} as const;

// ---------------------------------------------------------------------------
// Helper to build bounty URL from a bounty record
// ---------------------------------------------------------------------------

export function buildBountyUrl(
  _organizationId: string,
  bountyId: string
): string {
  return `${env.BETTER_AUTH_URL}/bounty/${bountyId}`;
}
