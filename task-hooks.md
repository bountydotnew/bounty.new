# Better Auth Hooks — Post-Org Implementation

This document tracks all Better Auth hooks to implement AFTER the organizations feature is complete.
These are intentionally deferred to avoid overloading the org implementation.

---

## 1. Database Hooks (`databaseHooks`)

These run on database CRUD operations for Better Auth managed models.

### `user.create.after` — New user created
- [x] Auto-create personal team (handled during org feature, Phase 2)
- [ ] Subscribe user to Resend marketing audience (`subscribeToAudience()`)
- [x] Send Discord webhook notification for new signup (Phase 8)

### `user.update.after` — User updated
- [x] If `handle` changed, update personal team slug + name to match (Phase 8, via direct DB update)
- [ ] If `handle` changed, validate new handle doesn't conflict with existing org slugs

### `session.create.before` — New session created
- [x] Set `activeOrganizationId` to user's personal org if not set (handled during org feature, Phase 2)

### `account.create.after` — OAuth account linked
- [x] Sync GitHub handle (already exists in codebase)
- [ ] Sync profile image from OAuth provider if user has no image set
- [ ] For GitHub: auto-link any pending GitHub App installations that match the account

### `account.update.after` — OAuth account updated (token refresh, etc.)
- [x] Sync GitHub handle (already exists in codebase)

---

## 2. Auth Endpoint Hooks (`hooks.before` / `hooks.after`)

These run before/after Better Auth API endpoint execution using `createAuthMiddleware`.

### After signup (`hooks.after`, path `/sign-up/*`)
- [ ] Send Discord webhook: "New user registered: {name}"
- [ ] Track signup analytics event
- [ ] If user came from waitlist (has `waitlist` entry), link them automatically

### After email verification (`emailVerification.afterEmailVerification`)
- [ ] Create in-app notification: "Your email has been verified"
- [ ] If user was on waitlist and email matches, auto-link waitlist entry

### After sign-in (`hooks.after`, path `/sign-in/*`)
- [ ] Track sign-in analytics event
- [ ] Update last active timestamp (if we add one)

---

## 3. Organization Plugin Hooks (`organizationHooks`)

These are specific to the Better Auth `organization()` plugin.

### `beforeCreateOrganization`
- [x] Validate slug against reserved words list (handled during org feature, Phase 1)

### `afterCreateOrganization`
- [ ] Send Discord webhook: "New team created: {org.name} by {user.name}"
- [ ] Create default org settings/preferences (if we add an org settings table later)
- [ ] Track org creation analytics event

### `afterCreateInvitation` (invitation sent)
- [x] Send org invitation email via Resend (Phase 8: OrgInvitation template + sendEmail in sendInvitationEmail)
- [ ] Create in-app notification for the inviter: "Invitation sent to {email}"
- [ ] Send Discord webhook for team activity: "{user} invited {email} to {org}"

### `beforeAcceptInvitation` (invitation about to be accepted)
- [ ] Validate any business rules (e.g., max members per org based on plan)

### `afterAcceptInvitation` (invitation accepted, member added)
- [ ] Create in-app notification for the inviter: "{user} accepted your invitation to {org}"
- [ ] Create in-app notification for all existing org members: "{user} joined {org}"
- [ ] Send Discord webhook: "{user} joined team {org}"

### `afterRejectInvitation` (invitation rejected)
- [ ] Create in-app notification for the inviter: "{email} declined your invitation to {org}"

### `afterRemoveMember` (member removed from org)
- [ ] Create in-app notification for the removed user: "You were removed from {org}"
- [ ] Clean up: if removed user was the only one with GitHub account linked, warn org owner
- [ ] Send Discord webhook: "{user} was removed from {org}"

### `afterUpdateMemberRole` (member role changed)
- [ ] Create in-app notification for the affected user: "Your role in {org} changed to {newRole}"

### `beforeDeleteOrganization` (org about to be deleted)
- [ ] Prevent deletion if org has active (funded) bounties
- [ ] Warn if org has pending invitations

### `afterDeleteOrganization` (org deleted)
- [ ] Clean up: unlink all GitHub/Linear installations from this org
- [ ] Cancel any pending invitations (Better Auth may handle this)
- [ ] Create in-app notification for all former members: "{org} has been deleted"

---

## 4. Missing Email Templates to Create

| Template | Trigger | Props |
|---|---|---|
| `OrgInvitation` | Org member invitation | `inviterName`, `orgName`, `role`, `inviteLink` |
| `SubmissionReceived` | New submission on bounty | `bountyTitle`, `submitterName`, `bountyUrl` |
| `SubmissionApproved` | Submission approved | `bountyTitle`, `bountyUrl`, `amount` |
| `SubmissionRejected` | Submission rejected | `bountyTitle`, `bountyUrl`, `reviewNotes` |
| `BountyCompleted` | Bounty awarded/completed | `bountyTitle`, `bountyUrl`, `amount`, `solverName` |
| `NewBountyComment` | New comment on bounty (email digest) | `bountyTitle`, `commenterName`, `commentPreview`, `bountyUrl` |
| `MemberJoined` | New member joined org (email to owner) | `memberName`, `orgName` |
| `RoleChanged` | Member role changed (email to affected user) | `orgName`, `newRole` |

---

## 5. Missing Notification Events to Add

Currently only these events create in-app notifications:
- `bounty_comment` — new comment on bounty (notifies bounty owner only)
- `system` — bounty refunded (notifies bounty creator only)
- Admin-sent custom notifications

### Events that SHOULD create in-app notifications:

| Event | Who to notify | Notification type |
|---|---|---|
| New submission on bounty | All org members (fan-out) | `submission_received` |
| Submission approved | The solver | `submission_approved` |
| Submission rejected | The solver | `submission_rejected` |
| Bounty funded (payment confirmed) | All org members | `system` |
| Bounty completed/awarded | All org members + solver | `bounty_awarded` |
| New bounty application | Bounty creator (or all org members) | New type: `application_received` |
| Bounty assigned | The assigned solver | New type: `bounty_assigned` |
| Org invitation received | The invited user (if they have an account) | New type: `org_invitation` |
| Org member joined | All existing org members | New type: `org_member_joined` |
| Member role changed | The affected member | New type: `org_role_changed` |
| Early access granted | The user | `system` (currently email only) |

### New notification types to add to the `notification_type` enum:
- `application_received`
- `bounty_assigned`
- `org_invitation`
- `org_member_joined`
- `org_role_changed`

---

## 6. Discord Webhook Notifications to Add

Currently Discord webhooks are sent for:
- New bounty created (unfunded) -> `BOUNTY_UNFUNDED_WEBHOOK_URL`
- Bounty funded (payment confirmed) -> `BOUNTY_FUNDED_WEBHOOK_URL`
- Admin info/error/test webhooks -> `DISCORD_WEBHOOK_URL`
- Client-side error reports -> `DISCORD_WEBHOOK_URL`

### Events that SHOULD send Discord webhooks:

| Event | Webhook URL | Format |
|---|---|---|
| New user registered | `DISCORD_WEBHOOK_URL` | Info embed: "{name} joined bounty.new" |
| New team created | `DISCORD_WEBHOOK_URL` | Info embed: "{name} created team {orgName}" |
| Bounty completed/paid out | `BOUNTY_FEED_WEBHOOK_URL` | Rich embed: "{solver} completed {bountyTitle} for ${amount}" |
| Milestone: X bounties created | `DISCORD_WEBHOOK_URL` | Info embed: platform milestone |

---

## 7. Existing Hooks to Review/Improve

### GitHub handle sync (`databaseHooks.account.create.after`)
- Currently only syncs on `create` and `update` — consider also syncing profile image
- Should handle race condition: if user creates account via email first, then links GitHub, the personal team slug should update to match the GitHub handle

### Email verification flow
- `emailVerification.sendOnSignUp: true` is set — good
- `autoSignInAfterVerification: true` is set — good
- Missing: `afterEmailVerification` callback for tracking/notifications

### Password reset
- `sendResetPassword` is configured — good
- Missing: rate limiting on password reset requests (may be handled by Better Auth internally)

---

## Priority Order

1. **High**: Org invitation email template + `sendInvitationEmail` (blocks org invites)
2. **High**: Submission notification fan-out to org members
3. **High**: New user Discord webhook
4. **Medium**: Missing email templates (SubmissionReceived, SubmissionApproved, etc.)
5. **Medium**: In-app notification events for org lifecycle
6. **Low**: Discord webhook for bounty completion
7. **Low**: Analytics tracking hooks
