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
**Status:** ⚠️ OPEN  
**Files:** `apps/web/src/components/billing/account-dropdown.tsx`  
**Severity:** Medium  
**Fix:** Replace with a proper modal/dialog component.

### B5-05: Invite role mapping uses 'admin' instead of 'owner'
**Status:** ⚠️ OPEN  
**Files:** `apps/web/src/app/[slug]/settings/members/page.tsx`  
**Severity:** Medium  
**Fix:** Verify Better Auth's role names or add a mapping layer.

### B5-06: No pending invitations UI
**Status:** ⚠️ OPEN  
**Files:** `apps/web/src/app/[slug]/settings/members/page.tsx`  
**Severity:** Low  
**Fix:** Add invitations section using `authClient.organization.getInvitations()`.

## Settings Split

### B5-07: `/settings/billing` redirect requires client-side JS
**Status:** ✅ ACCEPTED  
**Files:** `apps/web/src/app/(settings)/settings/billing/page.tsx`  
**Severity:** Low  
**Description:** Old billing page is now a client-side redirect.  
**Fix:** Could use Next.js middleware for server-side redirect instead.

### B5-08: Org settings sidebar is only visible on desktop (lg breakpoint)
**Status:** ⚠️ OPEN  
**Files:** `apps/web/src/components/settings/org-settings-sidebar.tsx`  
**Severity:** Medium  
**Fix:** Add mobile-friendly tab bar or breadcrumb navigation.

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
