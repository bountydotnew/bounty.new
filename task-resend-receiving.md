# Resend Email Receiving — Implementation Plan

## Overview

Enable inbound email receiving via Resend webhooks. Any email sent to `<anything>@hecuatkra.resend.app` (or a future custom domain) will be received by Resend, parsed, and forwarded to our webhook endpoint as an `email.received` event.

**Resend receiving domain**: `hecuatkra.resend.app`

## Key Constraints

- **Resend SDK usage** (`resend.emails.receiving.*`, `resend.webhooks.verify()`) goes in `packages/email/`
- **Webhook route** goes in `apps/web/src/app/api/webhooks/resend/route.ts` (Next.js API route, NOT tRPC — same pattern as GitHub/Stripe/Marble webhooks)
- **Resend SDK version**: `^6.1.0` (has built-in `resend.webhooks.verify()` via Svix)
- Webhook payloads contain **metadata only** — body/attachments must be fetched via separate API calls

## Resend Docs Reference

When implementing, reference these docs:
- Receiving intro: `https://resend.com/docs/dashboard/receiving/introduction`
- Custom domains: `https://resend.com/docs/dashboard/receiving/custom-domains`
- Get email content: `https://resend.com/docs/dashboard/receiving/get-email-content`
- Process attachments: `https://resend.com/docs/dashboard/receiving/attachments`
- Forward emails: `https://resend.com/docs/dashboard/receiving/forward-emails`
- Reply to emails: `https://resend.com/docs/dashboard/receiving/reply-to-emails`
- Verify webhooks: `https://resend.com/docs/webhooks/verify-webhooks-requests`
- Retrieve received email API: `https://resend.com/docs/api-reference/emails/retrieve-received-email`

## Webhook Event Shape

```json
{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "56761188-7520-42d8-8898-ff6fc54ce618",
    "created_at": "2024-02-22T23:41:11.894719+00:00",
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "bcc": [],
    "cc": [],
    "message_id": "<example+123>",
    "subject": "Sending this example",
    "attachments": [
      {
        "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
        "filename": "avatar.png",
        "content_type": "image/png",
        "content_disposition": "inline",
        "content_id": "img001"
      }
    ]
  }
}
```

**Important**: Webhooks do NOT include the email body, headers, or attachment content. Must call:
- `resend.emails.receiving.get(emailId)` for HTML/text body + headers
- `resend.emails.receiving.attachments.list({ emailId })` for attachment download URLs (valid 1 hour)

## Webhook Verification

Resend uses Svix for webhook signing. Headers:
- `svix-id`
- `svix-timestamp`
- `svix-signature`

Verify using the SDK's built-in method:
```ts
const result = resend.webhooks.verify({
  payload,  // raw request body string
  headers: {
    id: headers.get('svix-id'),
    timestamp: headers.get('svix-timestamp'),
    signature: headers.get('svix-signature'),
  },
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
});
```

## Replying to Emails (threading)

To reply in the same thread, set `In-Reply-To` header to the original `message_id`:
```ts
await resend.emails.send({
  from: 'Bounty <support@bounty.new>',
  to: [originalSender],
  subject: `Re: ${originalSubject}`,
  html: '<p>Response content</p>',
  headers: {
    'In-Reply-To': originalMessageId,
  },
});
```

For multi-reply threads, also set `References` header with all previous message IDs.

## Forwarding Emails

SDK provides a `forward()` helper:
```ts
await resend.emails.receiving.forward({
  emailId: event.data.email_id,
  to: 'team@bounty.new',
  from: 'forwarded@bounty.new',
});
```

Use `passthrough: false` for email-client-style forwarding with "forwarded message" footer.

---

## Implementation Steps

### Step 1: Environment Variable

**File**: `packages/env/src/server.ts`

Add `RESEND_WEBHOOK_SECRET` (optional, `z.string().min(1).optional()`) alongside existing `RESEND_API_KEY`.

### Step 2: Receiving Helpers in Email Package

**New file**: `packages/email/src/resend/receiving.ts`

Export helper functions that wrap the Resend SDK receiving APIs:

```ts
// Functions to add:
getReceivedEmail(emailId: string)        // wraps resend.emails.receiving.get()
getReceivedAttachments(emailId: string)  // wraps resend.emails.receiving.attachments.list()
forwardReceivedEmail(opts)               // wraps resend.emails.receiving.forward()
replyToReceivedEmail(opts)               // sends reply with In-Reply-To header for threading
```

**Update**: `packages/email/src/resend/index.ts` — add receiving exports
**Update**: `packages/email/src/resend/types.ts` — add receiving-related types if needed

### Step 3: Webhook Verification Helper

**New file**: `packages/email/src/resend/webhook.ts`

Export a `verifyResendWebhook(payload, headers)` function that wraps `resend.webhooks.verify()`.

**Update**: `packages/email/src/resend/index.ts` — add webhook exports

### Step 4: Webhook Route

**New file**: `apps/web/src/app/api/webhooks/resend/route.ts`

Following the established webhook pattern (see GitHub/Stripe/Marble routes):

1. Export `async function POST(request: Request)`
2. Read raw body via `request.text()`
3. Extract Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`)
4. Verify signature using the helper from Step 3
5. Parse the verified payload
6. If `event.type === 'email.received'`, process the email:
   - Route based on `to` address (e.g., `support@...`, `bounty-{id}@...`)
   - Fetch full content via `getReceivedEmail()`
   - Log/store/forward as needed
7. Return `NextResponse.json({ received: true })`

### Step 5: Email Routing Logic

Inside the webhook handler, route based on the `to` address:

- `support@hecuatkra.resend.app` → Forward to team or store as support ticket
- `*@hecuatkra.resend.app` → Catch-all, log for now

This can be expanded later for bounty-specific email addresses, reply tracking, etc.

### Step 6: Barrel Exports

**Update**: `packages/email/src/index.ts` — ensure receiving + webhook exports are accessible

---

## Files Changed (Summary)

| File | Action | Description |
|------|--------|-------------|
| `packages/env/src/server.ts` | Modify | Add `RESEND_WEBHOOK_SECRET` env var |
| `packages/email/src/resend/receiving.ts` | Create | Receiving helper functions |
| `packages/email/src/resend/webhook.ts` | Create | Webhook verification helper |
| `packages/email/src/resend/types.ts` | Modify | Add receiving types |
| `packages/email/src/resend/index.ts` | Modify | Add receiving + webhook exports |
| `packages/email/src/index.ts` | Modify | Ensure new exports accessible |
| `apps/web/src/app/api/webhooks/resend/route.ts` | Create | Resend webhook endpoint |

## Dashboard Setup Required (Manual)

1. Go to Resend dashboard > [Webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Enter endpoint URL: `https://<your-domain>/api/webhooks/resend`
4. Select event type: `email.received`
5. Click "Add"
6. Copy the signing secret → set as `RESEND_WEBHOOK_SECRET` env var

Receiving domain is already available: `hecuatkra.resend.app`
