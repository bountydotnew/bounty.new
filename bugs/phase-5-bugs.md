# Phase 5 Bugs: Frontend Routing & UI

## Route Migration

### B5-01: Old Linear deep routes still have hardcoded paths
**Status:** ⚠️ ACCEPTED (Low priority)  
**Files:** `apps/web/src/app/(linear-integrations)/integrations/linear/[workspaceId]/**`  
**Severity:** Low  
**Description:** The old `(linear-integrations)` route group's workspace/issues/projects pages still have hardcoded `/integrations/linear/...` paths. The root `/integrations/linear` redirects to `/{slug}/integrations/linear`.  
**Impact:** Bookmarked deep links work but show old URLs.  
**Fix:** Can be removed once migration is confirmed complete.

### B5-02: OAuth callback URLs don't include org slug
**Status:** ⚠️ ACCEPTED (Extra redirect acceptable)  
**Files:** `apps/web/src/hooks/use-integrations.ts`  
**Severity:** Low  
**Description:** OAuth callbacks use `/integrations/discord` and `/integrations/linear`. Users land on old paths then get redirected.  
**Fix:** Acceptable — extra 200ms redirect hop after OAuth.

### B5-03: GitHub installation callback redirect resolves slug per-request
**Status:** ✅ ACCEPTED (Performance acceptable)  
**Files:** `apps/web/src/app/api/github/installation-callback/route.ts`  
**Severity:** Low  
**Description:** Extra DB query to resolve org slug. Negligible performance impact.

## Members Page

### B5-04: Create team uses window.prompt
**Status:** ✅ FIXED  
**Files:** `apps/web/src/components/billing/account-dropdown.tsx`  
**Severity:** Medium  
**Fix:** Replaced with a proper `CreateTeamDialog` using `@bounty/ui/components/dialog`. Shows team name input, auto-generates slug with preview, and has proper create/cancel buttons.

### B5-05: Invite role mapping uses 'admin' instead of 'owner'
**Status:** ✅ FIXED  
**Files:** `apps/web/src/app/[slug]/settings/members/page.tsx`  
**Severity:** Medium  
**Fix:** Better Auth accepts 'owner' as a valid role (it's one of three defaultRoles: admin, owner, member). Removed incorrect `as 'member' | 'admin'` type casts. Added `toApiRole()` helper for clarity and forward-compatibility.

### B5-06: No pending invitations UI
**Status:** ✅ FIXED  
**Files:** `apps/web/src/app/[slug]/settings/members/page.tsx`  
**Severity:** Low  
**Fix:** Added pending invitations section using `authClient.organization.listInvitations()`. Shows invite email, role, expiry date, and a cancel button for each. Only visible to org owners on non-personal teams.

## Settings Split

### B5-07: `/settings/billing` redirect requires client-side JS
**Status:** ✅ ACCEPTED  
**Files:** `apps/web/src/app/(settings)/settings/billing/page.tsx`  
**Severity:** Low  
**Description:** Old billing page is now a client-side redirect.  
**Fix:** Could use Next.js middleware for server-side redirect instead.

### B5-08: Org settings sidebar is only visible on desktop (lg breakpoint)
**Status:** ✅ FIXED  
**Files:** `apps/web/src/components/settings/org-settings-sidebar.tsx`, `apps/web/src/app/[slug]/settings/layout.tsx`  
**Severity:** Medium  
**Fix:** Added `OrgSettingsTabBar` component — horizontal tab bar with underline style, visible on mobile (< lg). Desktop sidebar remains unchanged. Settings layout now renders both: tab bar at top (mobile only) and sidebar in flex row (desktop only).

## Navigation

### B5-09: Integrations nav item active state is broad
**Status:** ⚠️ ACCEPTED  
**Files:** `apps/web/src/components/dual-sidebar/app-sidebar.tsx`  
**Severity:** Low  
**Description:** Uses `pathname.includes('/integrations')` for active detection.  
**Fix:** Could be more specific but works for current routes.

### B5-10: [slug] route could match static routes
**Status:** ⚠️ ACCEPTED (Edge case)  
**Files:** `apps/web/src/app/[slug]/layout.tsx`  
**Severity:** Low  
**Description:** If user creates org with slug like "pricing", static route takes priority.  
**Note:** OrgSyncGuard redirects to /dashboard if slug doesn't match user's orgs.

### B5-11: OrgSyncGuard flashes spinner on every page navigation within same org
**Status:** ✅ FIXED  
**Files:** `apps/web/src/components/auth/org-sync-guard.tsx`  
**Severity:** Medium  
**Fix:** Initialize `synced` to `true` when `activeOrg?.slug === slug` already true.
