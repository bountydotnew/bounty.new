# Phase 4 Bugs: Billing Re-Scoping (Autumn)

## BUGS

_No bugs found._

## ISSUES

### P4-I1: Autumn SDK cache not invalidated on org switch
**File:** `apps/web/src/hooks/use-billing.ts`
**Severity:** Medium (will cause stale billing data when switching orgs)
**Description:** When the user switches their active organization, the Autumn SDK's `useCustomer()` hook will still display the previous org's billing data until the page is refreshed or `refetch()` is called. The backend `identify()` correctly returns the new org's customer ID, but the client-side SDK doesn't know to refetch.
**Fix:** In the team switcher (Phase 5), call `refetch()` from `useBilling()` or `useCustomer()` after `authClient.organization.setActive()` completes. This will cause the SDK to re-identify with the new org.

### P4-I2: Billing settings page shows "Your Plan" but it's now the org's plan
**File:** `apps/web/src/components/settings/billing-settings-client.tsx`
**Severity:** Low (UI copy issue)
**Description:** The billing settings page uses user-centric language ("Your Plan", "Your Account"). Now that billing is org-scoped, this should say "Team Plan" or show the org name. This is a Phase 5 (frontend) concern.
**Fix:** Update UI copy in Phase 5 to reflect org-scoped billing.

## CONCERNS

### P4-C1: Migration: existing Autumn customers are user-scoped
**Description:** Existing users have Autumn customer IDs set to their `user.id`. After this change, the `identify()` function returns `organizationId` as the customer ID. Existing billing data (subscriptions, usage) tied to the user's ID won't be found when identified by their org ID.
**Recommendation:** Phase 7 (migration) must handle this — either:
  (a) Create new Autumn customers for each org and migrate subscriptions, or
  (b) For personal teams, set the Autumn customer ID to match the user's existing customer ID (one-time mapping), or
  (c) During the transition, have `identify()` fall back to `user.id` if the org has no existing Autumn customer

Option (c) is simplest for a soft launch. Document this in Phase 7 migration plan.

## NITPICKS

_None._
