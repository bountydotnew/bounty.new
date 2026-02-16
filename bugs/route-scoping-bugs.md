# Route Scoping Bugs: Linear, Discord, Bounties, GitHub Webhook

## BUGS

### RS-B1: GitHub webhook error comment — fixed `postComment`/`octokit` references
**Status:** ✅ FIXED  
**File:** `apps/web/src/app/api/webhooks/github/route.ts`  
**Severity:** Critical (was a compile error)  
**Fix:** Now uses `githubApp.createIssueComment()` with correct arguments.

### RS-B2: Linear `disconnect` uses `orgOwnerProcedure` — may be too restrictive
**Status:** ✅ ACCEPTED (Design decision)  
**File:** `packages/api/src/routers/linear.ts`  
**Severity:** Low  
**Description:** Disconnect requires org owner role. This is a reasonable default policy (only owners manage integrations).

### RS-B3: Linear `getLinearWorkspace` returns first matching workspace — ambiguity with multiple connections
**Status:** ✅ ACCEPTED (By design)  
**File:** `packages/api/src/routers/linear.ts`  
**Severity:** Low  
**Description:** Uses `LIMIT 1` when multiple workspaces exist. Most orgs will have one Linear workspace.  
**Fix:** No immediate fix needed. Can be extended for multi-workspace support later.

### RS-B4: Discord `getGuilds` filters by org but `getLinkedAccount` and `unlinkAccount` don't
**Status:** ✅ ACCEPTED (Correct design)  
**File:** `packages/api/src/routers/discord.ts`  
**Severity:** Low  
**Description:** Discord OAuth accounts are user-scoped, while guild selection is org-scoped. This is the correct design.

## NITPICKS

### RS-N1: `rateLimitedOrgProcedure` used for Linear read operations
**Status:** ✅ ACCEPTED (Reasonable)  
**File:** `packages/api/src/routers/linear.ts`  
**Description:** Rate limiting reads protects against external API abuse (Linear). Reasonable approach.
