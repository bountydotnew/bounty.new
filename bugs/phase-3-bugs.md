# Phase 3 Bugs: tRPC Middleware & Core Re-Scoping

## BUGS

### P3-B1: `getRepositories` and `getInstallation` have no org ownership check
**File:** `packages/api/src/routers/github-installation.ts`
**Severity:** High
**Description:** These two procedures still use `protectedProcedure` instead of `orgProcedure`. Any authenticated user can query any GitHub installation by ID, leaking repository data across orgs.
**Fix:** Change both to `orgProcedure` and add an ownership check: verify the queried installation's `organizationId` matches `ctx.org.id`.

### P3-B2: Installation callback creates orphaned installations when `activeOrganizationId` is null
**File:** `apps/web/src/app/api/github/installation-callback/route.ts`
**Severity:** High
**Description:** When a user completes a GitHub App installation, the callback reads `session.session?.activeOrganizationId`. If this is null (e.g., session hook race condition from P2-B3, or user hasn't set active org), the installation is created with `organizationId: null`. This installation is invisible to all org-scoped queries and effectively orphaned.
**Fix:** If `activeOrganizationId` is null, fall back to the user's personal team (query `getPersonalTeamId`). If that also fails, return an error instead of creating an orphaned record.

### P3-B3: Installation callback can silently re-assign installation between orgs
**File:** `apps/web/src/app/api/github/installation-callback/route.ts`
**Severity:** Medium
**Description:** The callback uses `onConflictDoUpdate` keyed on `installationId`. If the same GitHub installation is re-authorized by a different user or with a different active org, the `organizationId` gets silently overwritten. This could move an installation from one org to another without the original org's knowledge.
**Fix:** On conflict, check if the existing `organizationId` matches the new one. If different, either reject or require explicit confirmation.

### P3-B4: Redundant `ensureOrgStripeCustomer` call in `createBounty`
**File:** `packages/api/src/routers/bounties.ts`
**Severity:** Low (performance, not correctness)
**Description:** In `createBounty`, the first `if (!payLater)` block calls `ensureOrgStripeCustomer` and stores the result, but this result is never used — the actual Stripe customer usage happens later in `createPaymentForBounty`. This doubles Stripe API calls for pay-now bounties.
**Fix:** Remove the redundant `ensureOrgStripeCustomer` call in the `createBounty` procedure. The customer is already ensured in `createPaymentForBounty`.

### P3-B5: `getMonthlySpend` missing upper date bound
**File:** `packages/api/src/routers/bounties.ts`
**Severity:** Medium
**Description:** `getMonthlySpend` computes `endOfMonth` but never uses it in the query filter. The query only has `gte(bounty.createdAt, startOfMonth)` without `lte(bounty.createdAt, endOfMonth)`. This means it includes bounties from future months if the query is cached or if system time shifts.
**Fix:** Add `lte(bounty.createdAt, endOfMonth)` to the where clause.

## ISSUES

### P3-I1: Linear `disconnect` doesn't verify workspace belongs to active org
**File:** `packages/api/src/routers/linear.ts`
**Severity:** Medium
**Description:** The `disconnect` procedure uses `orgOwnerProcedure` but only checks that the user is an owner of *some* org. It doesn't verify that the Linear workspace being disconnected actually belongs to `ctx.org.id`. A user who is an owner of Org A could disconnect a workspace belonging to Org B if they know the workspace ID.
**Fix:** Add a where clause: `and(eq(linearAccount.id, input.accountId), eq(linearAccount.organizationId, ctx.org.id))`.

### P3-I2: `setDefaultInstallation` uses `orgProcedure` not `orgOwnerProcedure`
**File:** `packages/api/src/routers/github-installation.ts`
**Severity:** Low
**Description:** `removeInstallation` requires `orgOwnerProcedure` but `setDefaultInstallation` only requires `orgProcedure`. Setting the default installation is an admin-level action that should be restricted to owners.
**Fix:** Change to `orgOwnerProcedure`.

### P3-I3: `handleInstallationEvent` determines `accountType` from `repository_selection` instead of `installation.account.type`
**File:** `apps/web/src/app/api/webhooks/github/route.ts`
**Severity:** Low (pre-existing bug, but touched in Phase 3)
**Description:** The code uses `payload.repository_selection` to determine if the GitHub account is a user or org, but this field indicates "all" vs "selected" repos — not the account type. The correct field is `payload.installation.account.type`.
**Fix:** Use `payload.installation.account.type` to determine if the installation is for a GitHub user or organization.

## CONCERNS

### P3-C1: `fetchMyBounties` shows all user bounties across all orgs
**File:** `packages/api/src/routers/bounties.ts`
**Description:** This procedure returns all bounties created by the user regardless of org. This may be intentional (personal dashboard view), but could leak org bounty titles/data to users who have since been removed from an org.
**Recommendation:** Consider filtering to only show bounties from orgs the user is currently a member of, or at minimum don't expose sensitive org-specific data.

### P3-C2: Any org member can update/delete any org bounty (no role restriction)
**File:** `packages/api/src/routers/bounties.ts`
**Description:** `isUserBountyOrgMember` only checks membership, not role. A `member` role user can delete bounties created by the `owner`. This may be intentional for small teams, but should be documented as a design decision.
**Recommendation:** Consider requiring `owner` role for `deleteBounty` at minimum.

### P3-C3: GitHub webhook bounty creation uses installation's org, not commenter's org
**File:** `apps/web/src/app/api/webhooks/github/route.ts`
**Description:** When a bounty is created via `!bounty` comment, the org is resolved from the GitHub installation's `organizationId`, not from the commenting user's active org. This is correct (the installation defines which org owns the repo), but could surprise users who are members of multiple orgs.
**Recommendation:** Document this behavior. Consider adding a comment in code explaining the rationale.

## NITPICKS

### P3-N1: Unused `ExtendedAuthSession` import
**File:** `packages/api/src/routers/github-installation.ts`
**Fix:** Remove the import.

### P3-N2: Duplicate `admin` import
**File:** `packages/api/src/routers/bounties.ts` (if applicable)
**Fix:** Remove the duplicate.
