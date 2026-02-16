# Testing: Resend Email Receiving

## Setup Required

### 1. Environment Variable
Add to your `.env` (or deployment environment):
```env
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
You'll get this value from the Resend dashboard after creating the webhook (step 3 below).

### 2. Get Your Receiving Domain
Your Resend receiving domain is: **`hecuatkra.resend.app`**

Any email sent to `<anything>@hecuatkra.resend.app` will be received by Resend and forwarded to your webhook.

### 3. Configure Webhook in Resend Dashboard
1. Go to [https://resend.com/webhooks](https://resend.com/webhooks)
2. Click **"Add Webhook"**
3. Enter endpoint URL:
   - **Production**: `https://bounty.new/api/webhooks/resend`
   - **Development**: Use ngrok or similar tunnel:
     ```bash
     ngrok http 3000
     # Then use: https://your-subdomain.ngrok.io/api/webhooks/resend
     ```
4. Select event type: **`email.received`**
5. Click **"Add"**
6. Copy the **signing secret** shown on the webhook details page
7. Set it as `RESEND_WEBHOOK_SECRET` in your environment

### 4. (Optional) Custom Domain
If you want to receive at `@yourdomain.tld`:
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Enable receiving for your domain
3. Add the MX record shown in the dashboard to your DNS
4. Wait for verification

## Test Checklist

### Basic Receiving
- [ ] Start the app locally with ngrok tunnel pointed at port 3000
- [ ] Send an email to `test@hecuatkra.resend.app` from any email client
- [ ] Check app logs for:
  ```
  [Resend Webhook] Email received: { emailId: '...', from: '...', to: ['test@hecuatkra.resend.app'], subject: '...', attachmentCount: 0 }
  [Resend Webhook] Email content fetched: { emailId: '...', hasHtml: true, hasText: true }
  ```
- [ ] Webhook returns `{ received: true }` (200 OK)

### Signature Verification
- [ ] Send a POST to `/api/webhooks/resend` without Svix headers → should return 400 "Missing webhook signature headers"
- [ ] Send a POST with invalid signature → should return 400 "Invalid webhook signature"
- [ ] Legitimate Resend webhook → should return 200

### With Attachments
- [ ] Send an email with an attachment to `anything@hecuatkra.resend.app`
- [ ] Check logs — `attachmentCount` should be > 0
- [ ] The attachment metadata (filename, content_type) is logged in the webhook event

### Without RESEND_WEBHOOK_SECRET
- [ ] Remove `RESEND_WEBHOOK_SECRET` from env
- [ ] Send a webhook → should return 500 "Webhook not configured"
- [ ] Check logs for error: `RESEND_WEBHOOK_SECRET not configured`

## Files Created/Modified

| File | Description |
|------|-------------|
| `packages/env/src/server.ts` | Added `RESEND_WEBHOOK_SECRET` (optional) |
| `packages/email/src/resend/receiving.ts` | Receiving helpers: `getReceivedEmail()`, `getReceivedAttachments()`, `listReceivedEmails()`, `replyToReceivedEmail()` |
| `packages/email/src/resend/webhook.ts` | Webhook verification: `verifyResendWebhook()`, re-exports `EmailReceivedEvent` type |
| `packages/email/src/resend/index.ts` | Added receiving + webhook barrel exports |
| `apps/web/src/app/api/webhooks/resend/route.ts` | Webhook POST handler with signature verification and email routing |

## API Available for Future Use

The following functions are available from `@bounty/email` for building on top of receiving:

```ts
import {
  getReceivedEmail,        // Fetch email body/headers
  getReceivedAttachments,  // List attachment download URLs
  listReceivedEmails,      // List all received emails
  replyToReceivedEmail,    // Reply in same thread (sets In-Reply-To header)
  verifyResendWebhook,     // Verify webhook signature
} from '@bounty/email';
```

### Replying to emails (threading)
```ts
await replyToReceivedEmail({
  to: 'sender@example.com',
  from: 'support@bounty.new',
  subject: 'Re: Original Subject',
  messageId: event.data.message_id,  // from webhook event
  html: '<p>Thanks for your email!</p>',
});
```

### Note on `forward()`
The `resend.emails.receiving.forward()` method is NOT available in Resend SDK `^6.1.0`. To forward emails, fetch the content with `getReceivedEmail()` and send via `sendEmail()`.
