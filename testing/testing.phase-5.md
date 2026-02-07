# Testing Phase 5: Frontend (Team Switcher, Sidebar, Hooks)

## Prerequisites
- Phases 1-4 complete
- User is logged in
- At least one personal team exists

## Test Checklist

### Sidebar WorkspaceSwitcher
- [ ] Sidebar header shows the active org name (truncated if long)
- [ ] Sidebar header shows the org's avatar (AvatarFacehash if no logo)
- [ ] For personal teams, name displays without "'s team" suffix
- [ ] Clicking the workspace switcher area opens the account dropdown

### Account Dropdown — Team Switcher Submenu
- [ ] Hover/click "Switch workspace" in the account dropdown
- [ ] A submenu appears showing all your teams
- [ ] Each team shows: avatar, name, role info (Personal / N members)
- [ ] Active team has a checkmark icon
- [ ] Personal team shows "Personal" label
- [ ] Non-personal teams show member count

### Switching Teams
- [ ] Click a different team in the submenu
- [ ] The sidebar header updates to show the new team
- [ ] All org-scoped data refreshes (bounties list, integrations, etc.)
- [ ] Billing data refreshes for the new org
- [ ] The toast doesn't show any error

### Create Team
- [ ] Click "Create team" at the bottom of the team submenu
- [ ] Enter a team name in the prompt
- [ ] Team is created and automatically switched to
- [ ] Toast shows success message: `Team "name" created`
- [ ] The new team appears in the team list
- [ ] Verify in DB:
  ```sql
  SELECT * FROM organization WHERE name = '<team-name>';
  SELECT * FROM member WHERE organization_id = '<new-org-id>';
  ```

### Edge Cases
- [ ] Try creating a team with an empty name → should be rejected (prompt returns null)
- [ ] Try creating a team with special characters → slug should be sanitized
- [ ] Rapidly switch teams → should not crash or show stale data
- [ ] If only one team (personal), submenu should still work

### Toast for No Active Org
- [ ] If `session.active_organization_id` is null (shouldn't happen normally), org-scoped routes should show toast: "Please select a team to continue."

### useActiveOrg Hook
- [ ] `activeOrgId` matches `session.activeOrganizationId`
- [ ] `orgs` list contains all teams the user is a member of
- [ ] `activeOrg` is the correct org from the list
- [ ] `isPersonalTeam` is true for personal teams, false otherwise
