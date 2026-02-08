# Testing Phase 8: Deferred Hooks (Invitation Email, Handle Sync, Discord Webhook)

## Prerequisites
- Phases 1-5 complete
- `RESEND_API_KEY` env var is set (for sending invitation emails)
- `DISCORD_WEBHOOK_URL` env var is set (optional, for signup notifications)

## Test Checklist

### Org Invitation Email
- [ ] Create a non-personal team (via "Create team" in the account dropdown)
- [ ] Invite a user to the team using Better Auth's invite API:
  ```ts
  // In browser console or via API:
  authClient.organization.inviteMember({
    email: 'test@example.com',
    role: 'member',
    organizationId: '<org-id>'
  })
  ```
- [ ] Check Resend dashboard — an invitation email should have been sent
- [ ] Email should use the `OrgInvitation` template with:
  - Inviter's name
  - Org name
  - Role (member/owner)
  - "Accept Invitation" button linking to `/org/invite/{invitation-id}`
  - "This invitation expires in 48 hours" text
- [ ] **Note**: The acceptance page (`/org/invite/[id]`) does NOT exist yet — this is a known gap (P8-B1). The invitation email is sent but the link won't resolve to a page. This needs a follow-up to create the acceptance page.

### Handle Change → Personal Team Slug Sync
- [ ] Update your handle in profile settings
- [ ] Check the database: personal team slug should match the new handle
  ```sql
  SELECT o.slug, o.name FROM organization o
  INNER JOIN member m ON m.organization_id = o.id
  WHERE m.user_id = '<user-id>' AND o.is_personal = true;
  ```
- [ ] Team name should be `{new-handle}'s team`

### Discord Signup Webhook
- [ ] Set `DISCORD_WEBHOOK_URL` to a Discord webhook URL
- [ ] Sign up with a new account
- [ ] Check the Discord channel — should see a "New User Registered" embed with:
  - User's name
  - User's email
  - Green color (0x00ff00)
  - Timestamp

### Session Hook Debug Logging
- [ ] In **development** (`NODE_ENV !== 'production'`), session creation should log debug info
- [ ] In **production**, no session creation debug logs should appear (they're gated behind `isDev`)
