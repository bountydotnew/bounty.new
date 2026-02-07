# Phase 5 Bugs: Frontend (Team Switcher, Sidebar, Hooks)

## BUGS

### P5-B1: `useActiveOrg` session refresh after `switchOrg` — LIKELY OK
**File:** `apps/web/src/hooks/use-active-org.ts`
**Severity:** Low (downgraded from High)
**Description:** After calling `authClient.organization.setActive()`, the hook calls `queryClient.invalidateQueries()` with no arguments, which invalidates ALL queries including Better Auth's internal session query (which uses React Query under the hood). This should trigger a session refetch, updating `activeOrganizationId`. Additionally, Better Auth's `setActive()` may internally refetch the session.
**Resolution:** Likely works correctly. If testing reveals the UI doesn't update after switching, add an explicit `sessionHook.refetch()` call. Monitor during testing.

### P5-B2: Team create uses `window.prompt` — poor UX, no validation
**File:** `apps/web/src/components/billing/account-dropdown.tsx` (line ~178)
**Severity:** Medium
**Description:** The "Create team" flow uses `window.prompt()` for the team name. This is functional but provides no validation feedback, no slug preview, no error handling for empty/duplicate names, and looks jarring. The slug derivation (lowercasing, replacing non-alphanumeric chars) is duplicated from the backend and could diverge.
**Fix:** Replace with a proper modal/dialog component. For now, the `window.prompt` works but should be a follow-up ticket.

### P5-B3: Personal team display name truncation logic is fragile
**File:** `apps/web/src/components/billing/account-dropdown.tsx` (line ~252), `apps/web/src/components/dual-sidebar/app-sidebar.tsx` (line ~80)
**Severity:** Low
**Description:** Both the team switcher submenu and the sidebar use `org.name.split("'s team")[0]` to display personal teams without the "'s team" suffix. This breaks if:
- The user's handle contains "'s team" (unlikely but possible)
- The team name format changes in the future
- The split returns empty string (handled with `|| org.name` in submenu but not sidebar)
**Fix:** The sidebar has `displayName.split("'s team")[0] || displayName` which partially handles it. Consider adding a utility function or using `isPersonal` flag to just show the handle directly (which is available as `org.slug` for personal teams).

### P5-B4: `useActiveOrg` uses raw `trpcClient` instead of `trpc.useQuery`
**File:** `apps/web/src/hooks/use-active-org.ts` (line ~55)
**Severity:** Low
**Description:** The hook uses `useQuery` from `@tanstack/react-query` with a manual `queryFn` calling `trpcClient.organization.listMyOrgs.query()` instead of using tRPC's React Query integration (e.g., `trpc.organization.listMyOrgs.useQuery()`). This works but bypasses tRPC's automatic query key generation and cache management, meaning `queryClient.invalidateQueries()` with tRPC-generated keys won't hit this query unless the manual key `['organization', 'listMyOrgs']` happens to match.
**Fix:** Either switch to the tRPC React hooks or ensure the manual query key matches what the rest of the app uses for invalidation. Since `switchOrg` calls `queryClient.invalidateQueries()` with no arguments (invalidates everything), this works in practice. Low priority.

## NITPICKS

### P5-N1: Missing loading/error states in `WorkspaceSwitcher`
**File:** `apps/web/src/components/dual-sidebar/app-sidebar.tsx`
**Description:** The `WorkspaceSwitcher` uses `useActiveOrg()` but doesn't handle the loading state. If orgs are loading, `activeOrg` will be undefined and the display falls back to session user name. Not a bug, but the transition could be smoother.

### P5-N2: `TeamSwitcherSubmenu` doesn't sort personal team first
**File:** `apps/web/src/components/billing/account-dropdown.tsx`
**Description:** The team list is ordered by `createdAt` (from the tRPC query). The personal team should ideally appear first in the list for quick access, regardless of creation order.
