# Testing Checklist

## Pre-Production Testing

### Basic Flow Test
- [ ] Install Stripe package (`npm install stripe`)
- [ ] Create checkout session opens Stripe in new tab
- [ ] Test card `4242 4242 4242 4242` completes successfully
- [ ] User redirects to success page
- [ ] Database updates with membership status
- [ ] Webhook receives and processes events

### Payment States Test
- [ ] Success: User shows "Pro Plan Active"
- [ ] Failed payment: Shows reactivation button
- [ ] Customer portal opens and functions
- [ ] Subscription cancellation works

### Webhook Testing
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to https://your-deployment.convex.site/stripe/webhook
```

Test events:
- [ ] `checkout.session.completed`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_failed`

## Common Issues

### Webhook not receiving events
- Verify using `.convex.site` (not `.convex.cloud`)
- Check `STRIPE_WEBHOOK_SECRET` is set correctly

### Membership not updating
- Check webhook events are being received
- Verify `constructEventAsync` is used (not `constructEvent`)
- Ensure `clerkUserId` is in checkout metadata

### API Version Mismatches
- All files should use `2025-08-27.basil`
- UI prices should match Stripe prices exactly