# Testing Phase 4: Billing Re-Scoping (Autumn)

## Prerequisites
- Phases 1-3 complete
- `AUTUMN_SECRET_KEY` env var is set
- User has an active organization

## Setup
- The Autumn billing API route (`/api/autumn/[...all]`) now uses `activeOrganizationId` as the Autumn customer ID
- Each org gets its own billing plan, independent of the user

## Test Checklist

### Identify
- [ ] Visit any page that triggers Autumn's `identify()` (e.g., pricing page, dashboard)
- [ ] Verify in Autumn dashboard that the customer ID is the **organization ID** (not the user ID)
- [ ] The customer ID should match `session.active_organization_id`

### Plan Per Org
- [ ] If you have two orgs, each should have independent billing state
  - Upgrade org A to Pro
  - Switch to org B — org B should still be on free plan
  - Switch back to org A — should still be Pro

### Billing Portal
- [ ] Click "Billing" in the account dropdown
- [ ] Should open Autumn's billing portal for the **active org**
- [ ] Verify the portal shows the correct org's subscription

### Checkout
- [ ] Start a checkout (upgrade plan)
- [ ] Verify the checkout is for the active org (check Autumn dashboard)

### useBilling Hook
- [ ] `isPro` should reflect the active org's plan status
- [ ] `concurrentBounties` feature should reflect the active org's entitlements
- [ ] Switching orgs should trigger a billing data refetch (via `refetchBilling()` in `useActiveOrg`)
