# Testing Phase 1: Schema & Better Auth Plugin Setup

## Prerequisites / Setup

### Database Schema Push
```bash
bun run db:push
```
This will create/update the following tables:
- `organization` (new) — with `is_personal`, `stripe_customer_id` additional fields
- `member` (new) — org membership with role
- `invitation` (new) — pending org invitations
- `session` — adds `active_organization_id` column
- `bounty` — adds `organization_id` column (nullable)
- `github_installation` — adds `organization_id` column
- `linear_account` — adds `organization_id` column
- `discord_guild` — adds `organization_id` column

### Verify Schema
After `db:push`, confirm the columns exist:
```sql
-- Check organization table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'organization' ORDER BY ordinal_position;

-- Check session has active_organization_id
SELECT column_name FROM information_schema.columns
WHERE table_name = 'session' AND column_name = 'active_organization_id';

-- Check bounty has organization_id
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bounty' AND column_name = 'organization_id';
```

## Test Checklist

- [ ] `db:push` runs without errors
- [ ] `organization` table exists with `id`, `name`, `slug`, `logo`, `metadata`, `is_personal`, `stripe_customer_id`, `created_at`
- [ ] `member` table exists with `id`, `user_id`, `organization_id`, `role`, `created_at`
- [ ] `invitation` table exists
- [ ] `session.active_organization_id` column exists
- [ ] `bounty.organization_id` column exists (nullable)
- [ ] `github_installation.organization_id` column exists
- [ ] `linear_account.organization_id` column exists
- [ ] `discord_guild.organization_id` column exists
- [ ] App builds successfully: `bun run build` (from apps/web)
