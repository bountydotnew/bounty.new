# Phase 2 Bugs: Personal Team Auto-Creation

## BUGS

### P2-B1: `createPersonalTeam` org + member insert is not atomic (no transaction)
**File:** `packages/auth/src/server.ts`
**Severity:** High
**Description:** `createPersonalTeam` does two separate inserts (organization, then member) without wrapping them in a transaction. If the org insert succeeds but the member insert fails (e.g., unique constraint, connection drop), an orphaned organization row is left in the database with no owner. The retry logic only handles slug collisions on the org insert — it doesn't handle member insert failures.
**Fix:** Wrap both inserts in `db.transaction(async (tx) => { ... })`. The slug collision retry should be outside the transaction (retry the whole transaction).

### P2-B2: `createPersonalTeam` retry can leave orphaned org rows on member insert failure
**File:** `packages/auth/src/server.ts`
**Severity:** High (subset of P2-B1)
**Description:** If the first org insert succeeds and member insert fails, the catch block checks for slug collision (`23505` on org) and retries. But the failed iteration's org row is never cleaned up.
**Fix:** Same as P2-B1 — use a transaction so both inserts are atomic.

### P2-B3: Race condition during OAuth signup
**File:** `packages/auth/src/server.ts`
**Severity:** Medium
**Description:** During OAuth signup, `databaseHooks.user.create.after` fires to create the personal team, and `databaseHooks.session.create.before` fires to set `activeOrganizationId`. If the session hook fires before the user hook completes (possible if Better Auth doesn't guarantee ordering), `getPersonalTeamId` will return null and the session won't have an active org.
**Fix:** In `session.create.before`, if `getPersonalTeamId` returns null, either: (a) create the personal team inline (idempotently), or (b) let it be null and handle lazily on first API request. Option (b) is simpler and more resilient.

## CONCERNS

### P2-C1: Slug derivation from email may produce poor slugs
**Description:** If a user has no handle, the slug is derived from the email prefix. This can produce slugs like `john.doe+test` or `admin` which may collide frequently or look bad.
**Fix:** Consider sanitizing the email-derived slug more aggressively (strip `+` suffixes, replace dots with hyphens, etc.). Low priority.
