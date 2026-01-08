# Stripe + Convex Integration - Common Mistakes & Solutions

This document contains detailed solutions to common issues encountered when integrating Stripe with Convex.

## Issue 1: Wrong Webhook URL Domain ❌

### Mistake:
Using `.convex.cloud` domain for webhook URL

**Example:**
```
https://your-deployment.convex.cloud/stripe/webhook
```

### Error Symptoms:
- Webhooks never received
- Stripe shows webhook delivery failures
- 404 or connection errors in Stripe webhook logs

### Solution:
✅ Use `.convex.site` domain for HTTP Actions

**Correct URL:**
```
https://your-deployment.convex.site/stripe/webhook
```

### Explanation:
- `.convex.cloud` = Backend API (queries/mutations) - requires authentication
- `.convex.site` = HTTP Actions (webhooks, file uploads) - public endpoints

### How to Find Your Correct URL:
1. Go to Convex Dashboard
2. Navigate to Settings
3. Your HTTP Actions URL will use `.convex.site`
4. Append `/stripe/webhook` to this URL

---

## Issue 2: Synchronous Webhook Signature Verification ❌

### Mistake:
Using synchronous `constructEvent()` method

```typescript
const event = stripe.webhooks.constructEvent(body, sig, secret);
```

### Error Message:
```
SubtleCryptoProvider cannot be used in a synchronous context.
Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

### Solution:
✅ Use asynchronous `constructEventAsync()`

```typescript
const event = await stripe.webhooks.constructEventAsync(body, sig, secret);
```

### Explanation:
Convex's runtime environment requires async crypto operations. The Stripe SDK automatically uses `SubtleCryptoProvider` in edge/serverless environments, which requires async operations.

---

## Issue 3: Wrong Location for current_period_end ❌

### Mistake:
Looking for `current_period_end` at the top level of subscription object

```typescript
const currentPeriodEnd = subscription.current_period_end; // ❌ undefined
```

### Error Symptoms:
- `currentPeriodEnd` is `undefined`
- Membership expiry not set correctly
- User membership doesn't update after payment

### Solution:
✅ Access from nested subscription items array

```typescript
const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
```

### Explanation:
The Stripe subscription object structure has `current_period_end` nested within the subscription items:

```json
{
  "id": "sub_xxx",
  "status": "active",
  "items": {
    "data": [
      {
        "current_period_end": 1777215271,  // ← HERE
        "current_period_start": 1761490471
      }
    ]
  }
}
```

### Full Working Example:
```typescript
case "checkout.session.completed": {
  const session = event.data.object as any;
  const subscriptionId = session.subscription as string;

  // Retrieve the full subscription object
  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

  // Get current_period_end from the first subscription item
  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;

  if (!currentPeriodEnd) {
    console.error("❌ ERROR: No current_period_end found");
    break;
  }

  // Update user membership with expiry
  await ctx.runMutation(internal.stripeDb.updateMembershipStatus, {
    clerkUserId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd, // This is a Unix timestamp in seconds
  });
}
```

---

## Issue 4: Missing Webhook Secret in Environment ❌

### Mistake:
Not setting `STRIPE_WEBHOOK_SECRET` in Convex environment variables

### Error Symptoms:
- Webhook signature verification fails
- Error: "No signatures found matching the expected signature for payload"
- 400 Bad Request responses to Stripe webhooks

### Solution:
✅ Set webhook secret in Convex Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" on "Signing secret"
4. Copy the secret (starts with `whsec_...`)
5. Go to Convex Dashboard → Settings → Environment Variables
6. Add: `STRIPE_WEBHOOK_SECRET=whsec_your_secret_here`

---

## Issue 5: Missing Metadata in Checkout Session ❌

### Mistake:
Not including user identification in checkout session metadata

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: "subscription",
  line_items: [...],
  // ❌ Missing metadata
});
```

### Error Symptoms:
- Can't identify which user made the payment
- Unable to update correct user in database
- Webhook handler can't find user

### Solution:
✅ Include user identifiers in metadata

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: "subscription",
  line_items: [...],
  metadata: {
    clerkUserId: args.clerkUserId,
    userId: user._id,
  },
});
```

Then access in webhook:
```typescript
const clerkUserId = session.metadata?.clerkUserId;
```

---

## Issue 6: Wrong Checkout Mode ❌

### Mistake:
Using `mode: "payment"` for subscriptions or vice versa

```typescript
// For recurring subscription - WRONG
mode: "payment"

// For one-time payment - WRONG
mode: "subscription"
```

### Solution:
✅ Use correct mode for your use case

**For Subscriptions (recurring billing):**
```typescript
mode: "subscription"
```

**For One-Time Payments:**
```typescript
mode: "payment"
```

---

## Issue 7: Not Converting Timestamp Units ❌

### Mistake:
Storing Stripe's Unix timestamp (seconds) directly when expecting milliseconds

```typescript
membershipExpiry: args.currentPeriodEnd, // ❌ Seconds, not milliseconds
```

### Error Symptoms:
- Membership appears expired immediately
- Date shows as 1970 or invalid date

### Solution:
✅ Convert seconds to milliseconds for JavaScript Date compatibility

```typescript
membershipExpiry: args.currentPeriodEnd * 1000, // ✅ Convert to milliseconds
```

### Explanation:
- Stripe uses Unix timestamps in **seconds**
- JavaScript `Date` expects timestamps in **milliseconds**
- Multiply by 1000 to convert

---

## Issue 8: CORS Errors with Embedded Checkout ❌

### Mistake:
Trying to use embedded checkout without proper CORS setup

### Error Symptoms:
- CORS errors in browser console
- Embedded checkout doesn't load
- "Access-Control-Allow-Origin" errors

### Solution:
✅ Use **Hosted Checkout** (opens in new tab) instead

**Benefits of Hosted Checkout:**
- No CORS issues
- Better mobile support
- Simpler implementation
- More secure (Stripe handles all payment UI)
- PCI compliance handled by Stripe

**Implementation:**
```typescript
const session = await stripe.checkout.sessions.create({
  // ... other config
  mode: "subscription",
  // No ui_mode needed - defaults to hosted
});

// On frontend
if (result.url) {
  window.open(result.url, '_blank');
}
```

---

## Quick Debugging Checklist

When webhooks aren't working:

1. ✅ Webhook URL uses `.convex.site` domain
2. ✅ Using `constructEventAsync` (not `constructEvent`)
3. ✅ `STRIPE_WEBHOOK_SECRET` set in Convex environment
4. ✅ Webhook endpoint exists in `convex/http.ts`
5. ✅ HTTP router exported as default: `export default http`
6. ✅ Metadata includes user identification
7. ✅ Accessing `current_period_end` from correct location
8. ✅ Converting timestamps to milliseconds when needed

When checkout doesn't work:

1. ✅ `STRIPE_SECRET_KEY` set in Convex environment
2. ✅ `STRIPE_PRICE_ID` set in Convex environment
3. ✅ Correct `mode` ("subscription" vs "payment")
4. ✅ Valid `success_url` and `cancel_url`
5. ✅ User exists in database before creating checkout
6. ✅ Stripe customer created or retrieved correctly

## Testing Webhooks Locally

Use Stripe CLI to test webhooks during development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your Convex endpoint
stripe listen --forward-to https://your-deployment.convex.site/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

This helps you:
- See webhook payloads in real-time
- Debug signature verification
- Test event handling logic
- Verify user updates work correctly
