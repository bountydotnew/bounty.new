# Testing Phase 2: Personal Team Auto-Creation

## Prerequisites
- Phase 1 schema has been pushed (`db:push`)
- Phase 7 migration has been run (`bun run db:backfill-orgs`) — for existing users
- App is running locally (`bun dev` from apps/web)

## Test Checklist

### New User Signup
- [ ] Sign up with a new account (email/password or GitHub OAuth)
- [ ] Check the database: user should have a personal team
  ```sql
  SELECT o.id, o.name, o.slug, o.is_personal, m.role
  FROM organization o
  INNER JOIN member m ON m.organization_id = o.id
  WHERE m.user_id = '<new-user-id>' AND o.is_personal = true;
  ```
- [ ] Personal team name should be `{handle}'s team` (or `{email-prefix}'s team`)
- [ ] Personal team slug should match the user's handle
- [ ] User should be `owner` of the personal team
- [ ] Session should have `active_organization_id` set to the personal team ID
  ```sql
  SELECT active_organization_id FROM session
  WHERE user_id = '<new-user-id>' AND expires_at > now();
  ```

### GitHub OAuth Signup
- [ ] Sign up via GitHub OAuth
- [ ] Handle should be synced from GitHub username
- [ ] Personal team slug should match the GitHub username (lowercased)

### Self-Healing (Existing User Without Team)
- [ ] If you have an existing user WITHOUT a personal team, log them in
- [ ] The session hook should auto-create a personal team
- [ ] Check logs for `[session.create.before] self-healing: creating personal team`

### Handle Change Sync
- [ ] Change a user's handle (via profile settings or direct DB update)
- [ ] Verify the personal team's slug and name update to match
  ```sql
  UPDATE "user" SET handle = 'newtesthandle' WHERE id = '<user-id>';
  -- Then trigger a user update through the app
  ```
- [ ] Check logs for `[user.update.after] Synced personal team slug`

### Discord Webhook
- [ ] If `DISCORD_WEBHOOK_URL` is set, check that new signups send a Discord notification
- [ ] The embed should show the user's name and email
