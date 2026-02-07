# Testing Phase 3: tRPC Middleware & Core Re-Scoping

## Prerequisites
- Phases 1-2 complete (schema pushed, personal teams exist)
- User is logged in with an active organization

## Test Checklist

### orgProcedure Middleware
- [ ] Call any org-scoped endpoint (e.g., `organization.getActiveOrg`) — should succeed when logged in with active org
- [ ] Manually clear `session.active_organization_id` in DB and call an org-scoped endpoint — should get `no_active_org` error with toast "Please select a team to continue."
  ```sql
  UPDATE session SET active_organization_id = NULL WHERE user_id = '<user-id>';
  ```
- [ ] Verify the error reason code is `no_active_org` in the response

### orgOwnerProcedure Middleware
- [ ] As an org owner, call owner-only endpoints (e.g., disconnect GitHub installation) — should succeed
- [ ] If you add yourself as a `member` (not `owner`) to another org, try calling owner-only endpoints on that org — should get "Only team owners can perform this action." error

### Bounty Routes
- [ ] **Create bounty**: Should set `bounty.organization_id` to the active org
  - Create a bounty through the web UI
  - Verify in DB: `SELECT organization_id FROM bounty WHERE id = '<bounty-id>'`
- [ ] **Fetch my bounties**: Should only return bounties for the active org
  - If you have bounties in different orgs, switch org and verify the list changes
- [ ] **Get monthly spend**: Should scope to active org
- [ ] **Edit/cancel/fund bounty**: Permission checks use `isUserBountyOrgMember` — verify you can edit bounties belonging to an org you're a member of, even if it's not your active org

### GitHub Installation Routes
- [ ] **List installations**: Should only show installations for the active org
- [ ] **Install new GitHub app**: Installation callback should set `organization_id` to the active org (or personal team as fallback)

### Linear Routes
- [ ] **Get connection status**: Should check for Linear workspace connected to the active org
- [ ] **Get workspaces**: Should scope to active org
- [ ] **Get issues/projects/teams**: Should use the workspace connected to the active org
- [ ] **Sync workspace / disconnect**: Should be org-scoped

### Discord Routes
- [ ] **Get guilds**: Should only show guilds with `organization_id` matching the active org
- [ ] **Link/unlink account**: These are user-scoped (not org-scoped) — should work regardless of active org

### Rate Limiting
- [ ] `rateLimitedOrgProcedure` routes should apply rate limits — verify by calling rapidly
