# Phase 1 Bugs: Schema & Better Auth Plugin Setup

## BUGS

### P1-B1: `orgMemberRoleEnum` defined but not used on `member.role` column — WON'T FIX
**Status:** ✅ WON'T FIX (Intentional design)  
**File:** `packages/db/src/schema/organization.ts`  
**Severity:** Low (downgraded)  
**Description:** The `orgMemberRoleEnum` pgEnum is defined but the `member.role` column uses a plain `text()` type instead. However, Better Auth's organization plugin manages the `member` table internally and expects `role` to be a `text` column. Using a pgEnum would conflict with Better Auth's ORM expectations.

### P1-B2: Missing `user.additionalFields` for `handle` in Better Auth config
**Status:** ✅ FIXED  
**File:** `packages/auth/src/server.ts`  
**Severity:** Low (only affects Better Auth's type inference, not runtime)  
**Fix:** Added `user: { additionalFields: { handle: { type: 'string', required: false } } }` to the auth config.

## NITPICKS

### P1-N1: Unused `ExtendedAuthSession` import will be introduced in Phase 3
**Status:** ✅ RESOLVED  
Not a Phase 1 issue per se — tracked in Phase 3.

### P1-N2: `no_active_org` reason code not in `ReasonCode` union type
**Status:** ✅ FIXED  
**File:** `packages/types/src/auth.ts`  
**Fix:** Added `'no_active_org'` to the ReasonCode union type.
