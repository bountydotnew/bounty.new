# Phase 8 Bugs: Deferred Hooks (Invitation Email, Handle Sync, Discord Webhook)

## BUGS

### P8-B1: `sendInvitationEmail` invite URL format may not match Better Auth's acceptance endpoint
**File:** `packages/auth/src/server.ts` (line ~524)
**Severity:** High
**Status:** ✅ FIXED
**Description:** The invite URL is constructed as `${AUTH_CONFIG.baseURL}/org/invite/${data.id}`. However, Better Auth's organization plugin typically handles invitation acceptance at `/api/auth/organization/accept-invitation` with query parameters (or a token-based flow). The URL `/org/invite/${data.id}` would need a corresponding frontend page that calls `authClient.organization.acceptInvitation()` with the invitation ID.
**Fix:** The frontend acceptance page now exists at `apps/web/src/app/org/invite/[id]/page.tsx` which calls `authClient.organization.acceptInvitation()` with the invitation ID and redirects to the team on success.

### P8-B2: `user.update.after` hook syncs slug without checking for collisions
**File:** `packages/auth/src/server.ts`
**Severity:** Medium
**Status:** ✅ FIXED
**Description:** When a user's handle changes, the hook updates the personal team's slug to match. If another org already has that slug, the DB update will fail with a unique constraint violation.
**Fix:** Added retry loop (same pattern as `createPersonalTeam()`): tries exact handle first, then `{handle}-{random6}` on collision. The outer catch still handles gracefully — logs error, doesn't break the update.

### P8-B3: `OrgInvitation` email template hardcodes 48-hour expiration text
**File:** `packages/email/src/templates/OrgInvitation.tsx`
**Severity:** Low
**Status:** ✅ FIXED
**Description:** The template said "This invitation expires in 48 hours" but was hardcoded.
**Fix:** Verified Better Auth's default `invitationExpiresIn` is `3600 * 48` seconds (48 hours), so the default was correct. Made `expiresIn` a prop (defaults to "48 hours") for future configurability.

## NITPICKS

### P8-N1: Excessive `console.warn` logging in session hook
**File:** `packages/auth/src/server.ts`
**Status:** ✅ FIXED
**Description:** Debug logging was firing on every session creation and user signup in production.
**Fix:** Removed ungated `console.warn` from `user.create.after`. Gated `createPersonalTeam` and `user.update.after` logs behind `NODE_ENV !== 'production'`. The `session.create.before` hook was already gated (unchanged).

### P8-N2: Discord signup webhook embed color uses hex literal
**File:** `packages/auth/src/server.ts` (line ~316)
**Description:** `color: 0x00_ff_00` uses numeric separators which is fine but unconventional for Discord embed colors. Minor style nit.
