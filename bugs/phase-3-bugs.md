# Phase 3 Bugs: tRPC Middleware & Core Re-Scoping

## BUGS

### P3-B1: `getRepositories` and `getInstallation` have no org ownership check
**Status:** ✅ FIXED  
**File:** `packages/api/src/routers/github-installation.ts`  
**Severity:** High  
**Fix:** Both procedures now use `orgProcedure` with explicit ownership checks verifying the installation's `organizationId` matches `ctx.org.id`.

### P3-B2: Installation callback creates orphaned installations when `activeOrganizationId` is null
**Status:** ✅ FIXED  
**File:** `apps/web/src/app/api/github/installation-callback/route.ts`  
**Severity:** High  
**Fix:** Falls back to user's personal team if no active org. Returns error if neither exists.

### P3-B3: Installation callback can silently re-assign installation between orgs
**Status:** ⚠️ ACCEPTED (Design decision)  
**File:** `apps/web/src/app/api/github/installation-callback/route.ts`  
**Severity:** Medium  
**Description:** On conflict, the callback updates `organizationId`. This allows moving an installation if needed.  
**Note:** Current behavior accepted; can be restricted later if abuse is detected.

### P3-B4: Redundant `ensureOrgStripeCustomer` call in `createBounty`
**Status:** ✅ FIXED  
**File:** `packages/api/src/routers/bounties.ts`  
**Severity:** Low (performance, not correctness)  
**Fix:** Removed redundant call; customer is ensured in `createPaymentForBounty`.

### P3-B5: `getMonthlySpend` missing upper date bound
**Status:** ✅ FIXED  
**File:** `packages/api/src/routers/bounties.ts`  
**Severity:** Medium  
**Fix:** Added `lte(transaction.createdAt, endOfMonth)` to the where clause.

## ISSUES

### P3-I1: Linear `disconnect` doesn't verify workspace belongs to active org
**Status:** ✅ FIXED  
**File:** `packages/api/src/routers/linear.ts`  
**Severity:** Medium  
**Fix:** Added where clause: `and(eq(linearAccount.id, input.accountId), eq(linearAccount.organizationId, ctx.org.id))`.

### P3-I2: `setDefaultInstallation` uses `orgProcedure` not `orgOwnerProcedure`
**Status:** ✅ FIXED  
**File:** `packages/api/src/routers/github-installation.ts`  
**Severity:** Low  
**Fix:** Changed to `orgOwnerProcedure`.

### P3-I3: `handleInstallationEvent` determines `accountType` from `repository_selection`
**Status:** ⚠️ ACCEPTED (Minor)  
**File:** `apps/web/src/app/api/webhooks/github/route.ts`  
**Severity:** Low  
**Note:** Pre-existing bug, functional but incorrect field usage.

## CONCERNS

### P3-C1: `fetchMyBounties` shows all user bounties across all orgs
**Status:** ✅ RESOLVED (By design)  
**Description:** This procedure returns all bounties created by the user. This is intentional for personal dashboard view.

### P3-C2: Any org member can update/delete any org bounty (no role restriction)
**Status:** ⚠️ ACCEPTED (Design decision)  
**Description:** `isUserBountyOrgMember` only checks membership, not role. Current policy allows any member to manage bounties.  
**Note:** Can be changed to require `owner` role if business rules change.

### P3-C3: GitHub webhook bounty creation uses installation's org, not commenter's org
**Status:** ✅ RESOLVED (Correct behavior)  
**Description:** This is correct — the installation defines org ownership. Documented in code comments.

## NITPICKS

### P3-N1: Unused `ExtendedAuthSession` import
**Status:** ✅ FIXED  
**Fix:** Removed the import.

### P3-N2: Duplicate `admin` import
**Status:** ✅ FIXED  
**Fix:** Removed the duplicate.
