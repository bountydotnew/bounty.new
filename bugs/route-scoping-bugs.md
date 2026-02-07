# Route Scoping Bugs: Linear, Discord, Bounties, GitHub Webhook

## BUGS

### RS-B1: GitHub webhook error comment — fixed `postComment`/`octokit` references (RESOLVED)
**File:** `apps/web/src/app/api/webhooks/github/route.ts` (line ~951)
**Severity:** Critical (was a compile error)
**Description:** The error comment for "no organization found" used non-existent `postComment()` and `octokit` variables. Should use `githubApp.createIssueComment(installation.id, ...)`.
**Resolution:** Fixed during type check pass. Now uses `githubApp.createIssueComment()` with correct arguments.

### RS-B2: Linear `disconnect` uses `orgOwnerProcedure` — may be too restrictive
**File:** `packages/api/src/routers/linear.ts`
**Severity:** Low
**Description:** The `disconnect` procedure requires org owner role. This means a regular team member who connected Linear cannot disconnect it. Whether this is correct depends on business rules — if "only owners manage integrations" is the policy, it's fine. If the user who connected should be able to disconnect, it should be `orgProcedure`.
**Fix:** Confirm the intended access control policy. The current implementation (owner-only) is a reasonable default.

### RS-B3: Linear `getLinearWorkspace` returns first matching workspace — ambiguity with multiple connections
**File:** `packages/api/src/routers/linear.ts` (line ~58)
**Severity:** Low
**Description:** When `orgId` is provided, `getLinearWorkspace()` filters by org AND active status but still uses `LIMIT 1`. If a user has multiple Linear workspaces connected to the same org, only the first one (by insertion order) is used. This is likely fine since most orgs will have one Linear workspace, but could be surprising.
**Fix:** No immediate fix needed. If multi-workspace support is added later, this helper will need to accept a workspace ID parameter.

### RS-B4: Discord `getGuilds` filters by org but `getLinkedAccount` and `unlinkAccount` don't
**File:** `packages/api/src/routers/discord.ts`
**Severity:** Low
**Description:** `getGuilds` is correctly scoped to `orgProcedure` with `ctx.org.id` filter. However, `getLinkedAccount` and `unlinkAccount` use plain `protectedProcedure` and operate on the user's Discord OAuth account (not org-scoped). This is correct because Discord OAuth accounts are user-level (linked accounts belong to the user, not the org), but it's worth noting the intentional asymmetry.
**Fix:** No fix needed — the Discord OAuth account is user-scoped, while the guild selection is org-scoped. This is the correct design.

## NITPICKS

### RS-N1: `rateLimitedOrgProcedure` used for Linear read operations
**File:** `packages/api/src/routers/linear.ts`
**Description:** All Linear procedures (including reads like `getIssues`, `getTeams`, etc.) use `rateLimitedOrgProcedure`. Rate limiting reads is a bit aggressive — `orgProcedure` without rate limiting might be more appropriate for read-only operations. However, since these read operations call external APIs (Linear), rate limiting them protects against abuse and is reasonable.
