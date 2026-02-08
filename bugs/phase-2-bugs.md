# Phase 2 Bugs: Personal Team Auto-Creation

## BUGS

### P2-B1: `createPersonalTeam` org + member insert is not atomic (no transaction)
**Status:** ✅ FIXED  
**File:** `packages/auth/src/server.ts`  
**Severity:** High  
**Fix:** Wrapped both inserts in `db.transaction(async (tx) => { ... })`. The slug collision retry happens outside the transaction.

### P2-B2: `createPersonalTeam` retry can leave orphaned org rows on member insert failure
**Status:** ✅ FIXED (subset of P2-B1)  
**File:** `packages/auth/src/server.ts`  
**Severity:** High  
**Fix:** Same as P2-B1 — use a transaction so both inserts are atomic.

### P2-B3: Race condition during OAuth signup
**Status:** ✅ FIXED  
**File:** `packages/auth/src/server.ts`  
**Severity:** Medium  
**Fix:** In `session.create.before`, if `getPersonalTeamId` returns null, the hook now creates the personal team inline (idempotently) and sets `activeOrganizationId`.

## CONCERNS

### P2-C1: Slug derivation from email may produce poor slugs
**Status:** ⚠️ ACCEPTED (Low priority)  
**Description:** If a user has no handle, the slug is derived from the email prefix. This can produce slugs like `john.doe+test` or `admin` which may collide frequently or look bad.  
**Recommendation:** Consider sanitizing the email-derived slug more aggressively (strip `+` suffixes, replace dots with hyphens, etc.).
