# Environment Setup

## Required Environment Variables

### Convex Dashboard (use Convex MCP tool if available)
```
STRIPE_SECRET_KEY=sk_test_... (dev) or sk_live_... (prod)
STRIPE_PRICE_ID=price_... (get from Stripe MCP tool or dashboard)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook endpoint)
```

### Next.js .env.local
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000 (dev) or https://yourdomain.com (prod)
```

## Stripe Dashboard Setup

### Create Product & Price
**Option 1: Use Stripe MCP Tool (Recommended)**
- Use tool to create product and price automatically
- Returns price ID needed for environment variables

**Option 2: Manual Setup**
1. Go to Stripe Dashboard → Products
2. Click "+ Add Product"
3. Enter details (name: "Pro Plan", price: $20.00/month)
4. Copy Price ID (starts with `price_...`)

### Webhook Configuration
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-deployment.convex.site/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
4. Copy signing secret for `STRIPE_WEBHOOK_SECRET`

## API Version Consistency
All Stripe API calls must use the same version: `2025-08-27.basil`