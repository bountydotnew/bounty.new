# Phase 7 Bugs: Migration Script (backfill-orgs.ts)

## BUGS

### P7-B1: Step 3 (GitHub installations) joins on `account.id = gi.github_account_id` — VERIFIED CORRECT
**File:** `scripts/backfill-orgs.ts` (line ~118)
**Severity:** N/A (not a bug)
**Description:** Initially flagged as potentially wrong — `github_account_id` could refer to a GitHub numeric ID rather than Better Auth's UUID. **Verified:** `githubInstallation.githubAccountId` has `.references(() => account.id)` in the schema, confirming it stores the Better Auth `account.id` UUID. The join is correct.
**Resolution:** No fix needed.

### P7-B2: Step 4 (Linear accounts) same potential column mismatch — VERIFIED CORRECT
**File:** `scripts/backfill-orgs.ts` (line ~135)
**Severity:** N/A (not a bug)
**Description:** Same initial concern as P7-B1. **Verified:** `linearAccount.accountId` has `.references(() => account.id)` in the schema. The join is correct.
**Resolution:** No fix needed.

### P7-B3: Step 1 team creation uses `gen_random_uuid()::text` — no retry isolation
**File:** `scripts/backfill-orgs.ts` (line ~63)
**Severity:** Low
**Description:** The CTE inserts both `organization` and `member` in a single SQL statement, which is good for atomicity. However, the slug collision retry (2 attempts) catches the error after the full statement fails, including the member insert. This is fine because PostgreSQL rolls back the entire statement on error, but worth noting. The retry suffix uses `Math.random()` which is less deterministic than `crypto.randomUUID()` but acceptable for a one-time migration.
**Fix:** No fix needed — the behavior is correct. The 2-attempt retry is sufficient for a migration script.

## NITPICKS

### P7-N1: No dry-run mode
**Description:** The script doesn't have a `--dry-run` flag to preview what it would do without making changes. This would be useful for production migrations.

### P7-N2: Summary stats don't include linear_account or discord_guild counts
**File:** `scripts/backfill-orgs.ts` (line ~202)
**Description:** The final summary only shows bounties and GitHub installations with/without org, but doesn't report on Linear accounts or Discord guilds. Minor — the step-by-step output shows the counts.
