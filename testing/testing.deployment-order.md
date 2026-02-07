# Deployment Order & Checklist

## Overview
This is the recommended order of operations when deploying the org changes.

## Step-by-Step Deployment

### 1. Push Schema Changes
```bash
bun run db:push
```
This adds new tables (`organization`, `member`, `invitation`) and new columns to existing tables. All new columns are nullable, so this is safe to run on a live DB.

### 2. Run Backfill Migration
```bash
bun run db:backfill-orgs
```
This creates personal teams for existing users and backfills `organization_id` on bounties, installations, etc. **Idempotent** — safe to run multiple times.

### 3. Deploy the Code
Deploy the updated app. The new code is backward-compatible:
- `bounty.organizationId` is nullable, so old bounties without org IDs still work
- Session hook self-heals users without personal teams on next login
- New signups automatically get personal teams

### 4. Set New Environment Variables
```env
# Required for Resend webhook receiving (optional feature)
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Configure Resend Webhook (if using email receiving)
1. Go to https://resend.com/webhooks
2. Add webhook: `https://bounty.new/api/webhooks/resend`
3. Select event: `email.received`
4. Copy signing secret → set as `RESEND_WEBHOOK_SECRET`

### 6. Verify
- [ ] New signups create personal teams automatically
- [ ] Existing users can log in (session hook auto-sets active org)
- [ ] Bounties are created with `organization_id`
- [ ] Team switcher works in the sidebar
- [ ] Billing is scoped to the active org
- [ ] GitHub/Linear/Discord integrations are org-scoped

## Rollback Plan
If something goes wrong:
1. The code is backward-compatible — reverting the deploy leaves the DB schema intact
2. New columns are nullable, so old code won't break
3. The backfill script doesn't delete any data
4. To fully rollback: revert deploy, then drop new columns/tables (but this shouldn't be necessary)

## Environment Variables Summary

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `RESEND_WEBHOOK_SECRET` | No | `packages/env/src/server.ts` | Signing secret for Resend webhook verification. Only needed if using email receiving. Get from Resend dashboard > Webhooks. |

All other existing env vars remain unchanged.
