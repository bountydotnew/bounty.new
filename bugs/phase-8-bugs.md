# Phase 8 Bugs: Deferred Hooks (Invitation Email, Handle Sync, Discord Webhook)

## BUGS

### P8-B1: `sendInvitationEmail` invite URL format may not match Better Auth's acceptance endpoint
**File:** `packages/auth/src/server.ts` (line ~524)
**Severity:** High
**Description:** The invite URL is constructed as `${AUTH_CONFIG.baseURL}/org/invite/${data.id}`. However, Better Auth's organization plugin typically handles invitation acceptance at `/api/auth/organization/accept-invitation` with query parameters (or a token-based flow). The URL `/org/invite/${data.id}` would need a corresponding frontend page that calls `authClient.organization.acceptInvitation()` with the invitation ID.
**Fix:** Verify Better Auth's expected invitation acceptance flow. If it expects the user to hit an API endpoint directly, the URL should point there. If a frontend page is needed to accept, create one at `apps/web/src/app/org/invite/[id]/page.tsx` that calls the accept API. Or use Better Auth's built-in `invitationURL` if the plugin supports it.

### P8-B2: `user.update.after` hook syncs slug without checking for collisions
**File:** `packages/auth/src/server.ts` (line ~347)
**Severity:** Medium
**Description:** When a user's handle changes, the hook updates the personal team's slug to match. If another org already has that slug, the DB update will fail with a unique constraint violation. The error is caught and logged, but the personal team's slug will be out of sync with the user's handle.
**Fix:** The catch block already handles this gracefully (logs error, doesn't break the update). Could be improved by trying a suffixed slug on collision, similar to `createPersonalTeam()`. Low urgency since slug collisions between personal teams and non-personal teams are unlikely.

### P8-B3: `OrgInvitation` email template hardcodes 48-hour expiration text
**File:** `packages/email/src/templates/OrgInvitation.tsx` (line ~55)
**Severity:** Low
**Description:** The template says "This invitation expires in 48 hours" but the actual expiration is controlled by Better Auth's organization plugin config (which may default to something different). The template text should match the actual expiration or be passed as a prop.
**Fix:** Either pass the expiration duration as a prop to the template, or verify Better Auth's default expiration matches 48 hours. If it does, this is fine.

## NITPICKS

### P8-N1: Excessive `console.warn` logging in session hook
**File:** `packages/auth/src/server.ts` (lines ~373-417)
**Description:** The `session.create.before` hook has 6 `console.warn` calls for debugging. These are useful during development but should be removed or gated behind `NODE_ENV === 'development'` before shipping to production, as they'll fire on every session creation.

### P8-N2: Discord signup webhook embed color uses hex literal
**File:** `packages/auth/src/server.ts` (line ~316)
**Description:** `color: 0x00_ff_00` uses numeric separators which is fine but unconventional for Discord embed colors. Minor style nit.
