# Testing Phase 7: Migration Script (backfill-orgs.ts)

## Prerequisites
- Phase 1 schema has been pushed (`db:push`)
- Existing users in the database (pre-org era users)

## Setup

### Run the Migration
```bash
bun run db:backfill-orgs
```

This script is **idempotent** — safe to run multiple times. All operations use `WHERE ... IS NULL` guards.

## What the Script Does

1. **Creates personal teams** for users who don't have one
2. **Backfills `bounty.organization_id`** from `bounty.created_by_id` → user's personal org
3. **Backfills `github_installation.organization_id`** from linked account → user's personal org
4. **Backfills `linear_account.organization_id`** from linked account → user's personal org
5. **Backfills `discord_guild.organization_id`** from `installed_by_id` → user's personal org
6. **Copies `user.stripe_customer_id`** to the personal org's `stripe_customer_id`
7. **Sets `session.active_organization_id`** for all active sessions

## Test Checklist

### Before Running
- [ ] Note the current counts:
  ```sql
  SELECT count(*) as users FROM "user";
  SELECT count(*) as personal_orgs FROM organization WHERE is_personal = true;
  SELECT count(*) as bounties_without_org FROM bounty WHERE organization_id IS NULL;
  SELECT count(*) as gh_without_org FROM github_installation WHERE organization_id IS NULL;
  ```

### After Running
- [ ] Script outputs step-by-step counts (teams created, rows updated)
- [ ] Script outputs summary at the end
- [ ] Every user has a personal team:
  ```sql
  SELECT u.id, u.email, o.name, o.slug FROM "user" u
  LEFT JOIN member m ON m.user_id = u.id
  LEFT JOIN organization o ON o.id = m.organization_id AND o.is_personal = true
  WHERE o.id IS NULL;
  -- Should return 0 rows
  ```
- [ ] No bounties without org (or at least fewer):
  ```sql
  SELECT count(*) FROM bounty WHERE organization_id IS NULL;
  ```
- [ ] GitHub installations have org IDs:
  ```sql
  SELECT count(*) FROM github_installation WHERE organization_id IS NULL;
  ```
- [ ] Active sessions have `active_organization_id`:
  ```sql
  SELECT count(*) FROM session
  WHERE active_organization_id IS NULL AND expires_at > now();
  -- Should return 0
  ```
- [ ] Stripe customer IDs copied to personal orgs:
  ```sql
  SELECT u.id, u.stripe_customer_id, o.stripe_customer_id
  FROM "user" u
  INNER JOIN member m ON m.user_id = u.id
  INNER JOIN organization o ON o.id = m.organization_id AND o.is_personal = true
  WHERE u.stripe_customer_id IS NOT NULL AND o.stripe_customer_id IS NULL;
  -- Should return 0 rows
  ```

### Idempotency
- [ ] Run the script a second time
- [ ] All counts should be 0 (no changes made)
- [ ] No errors
