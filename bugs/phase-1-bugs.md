# Phase 1 Bugs: Schema & Better Auth Plugin Setup

## BUGS

### P1-B1: `orgMemberRoleEnum` defined but not used on `member.role` column — WON'T FIX
**File:** `packages/db/src/schema/organization.ts`
**Severity:** Low (downgraded)
**Description:** The `orgMemberRoleEnum` pgEnum is defined but the `member.role` column uses a plain `text()` type instead. However, Better Auth's organization plugin manages the `member` table internally and expects `role` to be a `text` column. Using a pgEnum would conflict with Better Auth's ORM expectations.
**Resolution:** Won't fix. The enum definition is kept for documentation purposes. Role validation is handled at the application layer by Better Auth.

### P1-B2: Missing `user.additionalFields` for `handle` in Better Auth config
**File:** `packages/auth/src/server.ts`
**Severity:** Low (only affects Better Auth's type inference, not runtime)
**Description:** The `user` table has a `handle` column added via Drizzle schema, but Better Auth's config doesn't declare it in `user.additionalFields`. This means `session.user.handle` won't be typed or populated by Better Auth's session resolution. Currently works because the handle is read via direct DB queries in most places, but it's a correctness gap.
**Fix:** Add `user: { additionalFields: { handle: { type: 'string', required: false } } }` to the auth config.

## NITPICKS

### P1-N1: Unused `ExtendedAuthSession` import will be introduced in Phase 3
Not a Phase 1 issue per se — tracked in Phase 3.

### P1-N2: `no_active_org` reason code not in `ReasonCode` union type
**File:** `packages/types/src/auth.ts` (or wherever ReasonCode is defined)
**Description:** The `orgProcedure` middleware throws `no_active_org` as a reason code, but this isn't declared in the ReasonCode type union. TypeScript won't catch mismatches.
**Fix:** Add `'no_active_org'` to the ReasonCode union type.
