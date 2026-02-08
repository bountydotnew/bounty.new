# Phase 4 Bugs: Billing Re-Scoping (Autumn)

## BUGS

_No bugs found._

## ISSUES

### P4-I1: Autumn SDK cache not invalidated on org switch
**Status:** ✅ FIXED  
**File:** `apps/web/src/hooks/use-active-org.ts`  
**Severity:** Medium  
**Fix:** The `switchOrg` function now calls `refetchBilling()` from Autumn SDK and invalidates all tRPC queries after switching.

### P4-I2: Billing settings page shows "Your Plan" but it's now the org's plan
**Status:** ⚠️ OPEN (Phase 5 follow-up)  
**File:** `apps/web/src/components/settings/billing-settings-client.tsx`  
**Severity:** Low (UI copy issue)  
**Description:** The billing settings page uses user-centric language ("Your Plan", "Your Account"). Now that billing is org-scoped at `/{slug}/settings/billing`, this should say "Team Plan" or show the org name.  
**Fix:** Update UI copy to reflect org-scoped billing. Show active org name in the billing header.

## CONCERNS

### P4-C1: Migration: existing Autumn customers are user-scoped
**Status:** ✅ RESOLVED  
**Description:** Migration script (`scripts/backfill-orgs.ts`) handles this. Each org gets its own Autumn customer ID via `identify()`. Personal teams are handled correctly.

## NITPICKS

_None._
