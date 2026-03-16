#!/usr/bin/env bun
/**
 * Export PostgreSQL data to JSONL files for Convex import.
 *
 * Usage:
 *   dotenv -- bun convex/export-pg.ts
 *
 * This exports each PG table to a .jsonl file in convex/data/,
 * transforming:
 *   - snake_case columns → camelCase
 *   - decimal amounts → integer cents (bigint)
 *   - timestamps → Unix milliseconds
 *   - PG UUIDs kept as legacyPgId for FK resolution after import
 *
 * After export, import into Convex with:
 *   npx convex import --table users convex/data/users.jsonl
 *   npx convex import --table organizations convex/data/organizations.jsonl
 *   ... etc
 *
 * Then run FK resolution mutations to replace PG UUIDs with Convex IDs.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

const outDir = path.join(__dirname, 'convex', 'data');
fs.mkdirSync(outDir, { recursive: true });

const pool = new pg.Pool({ connectionString: DATABASE_URL });

function camel(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(row)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = val;
  }
  return out;
}

function toMs(date: any): number | undefined {
  if (!date) return;
  return new Date(date).getTime();
}

function toCentsNum(amount: any): number {
  if (amount === null || amount === undefined) return 0;
  const num =
    typeof amount === 'string' ? Number.parseFloat(amount) : Number(amount);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

async function readTable(tableName: string): Promise<any[]> {
  const { rows } = await pool.query(`SELECT * FROM "${tableName}"`);
  return rows.map(camel);
}

function writeJsonl(fileName: string, rows: any[]) {
  const filePath = path.join(outDir, `${fileName}.jsonl`);
  const lines = rows.map((r) => JSON.stringify(r));
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
  console.log(`  ${fileName}.jsonl: ${rows.length} rows`);
}

async function main() {
  console.log('Exporting PostgreSQL data to JSONL...\n');

  // -----------------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------------
  const pgUsers = await readTable('user');
  const users = pgUsers.map((u) => ({
    legacyPgId: u.id,
    betterAuthUserId: u.id,
    handle: u.handle || undefined,
    isProfilePrivate: u.isProfilePrivate ?? false,
    role: u.role || 'user',
    banned: u.banned ?? false,
    banReason: u.banReason || undefined,
    banExpires: toMs(u.banExpires),
    stripeCustomerId: u.stripeCustomerId || undefined,
    stripeConnectAccountId: u.stripeConnectAccountId || undefined,
    stripeConnectOnboardingComplete: u.stripeConnectOnboardingComplete ?? false,
    cardBackground: u.cardBackground || undefined,
    updatedAt: toMs(u.updatedAt) || Date.now(),
  }));
  writeJsonl('users', users);

  // -----------------------------------------------------------------------
  // Organizations
  // -----------------------------------------------------------------------
  const pgOrgs = await readTable('organization');
  const orgs = pgOrgs.map((o) => ({
    legacyPgId: o.id,
    betterAuthOrgId: o.id,
    name: o.name,
    slug: o.slug,
    logo: o.logo || undefined,
    metadata: o.metadata ? JSON.stringify(o.metadata) : undefined,
    isPersonal: o.isPersonal ?? false,
    stripeCustomerId: o.stripeCustomerId || undefined,
  }));
  writeJsonl('organizations', orgs);

  // -----------------------------------------------------------------------
  // Members (FKs: userId → users, organizationId → organizations)
  // -----------------------------------------------------------------------
  const pgMembers = await readTable('member');
  const members = pgMembers.map((m) => ({
    legacyPgId: m.id,
    _userId: m.userId, // PG UUID — will be resolved after import
    _organizationId: m.organizationId,
    role: m.role || 'member',
  }));
  writeJsonl('members', members);

  // -----------------------------------------------------------------------
  // Bounties (FKs: createdById → users, organizationId → organizations, assignedToId → users)
  // -----------------------------------------------------------------------
  const pgBounties = await readTable('bounty');
  const bounties = pgBounties.map((b) => ({
    legacyPgId: b.id,
    title: b.title,
    description: b.description || '',
    amountCents: { $integer: String(toCentsNum(b.amount)) },
    currency: b.currency || 'USD',
    status: b.status || 'draft',
    deadline: toMs(b.deadline),
    tags: b.tags || undefined,
    repositoryUrl: b.repositoryUrl || undefined,
    issueUrl: b.issueUrl || undefined,
    githubIssueNumber: b.githubIssueNumber ?? undefined,
    githubInstallationId: b.githubInstallationId ?? undefined,
    githubRepoOwner: b.githubRepoOwner || undefined,
    githubRepoName: b.githubRepoName || undefined,
    githubCommentId: b.githubCommentId ?? undefined,
    linearIssueId: b.linearIssueId || undefined,
    linearIssueIdentifier: b.linearIssueIdentifier || undefined,
    linearIssueUrl: b.linearIssueUrl || undefined,
    linearAccountId: b.linearAccountId || undefined,
    submissionKeyword: b.submissionKeyword || undefined,
    _organizationId: b.organizationId, // PG UUID
    _createdById: b.createdById, // PG UUID
    _assignedToId: b.assignedToId, // PG UUID
    isFeatured: b.isFeatured ?? false,
    stripePaymentIntentId: b.stripePaymentIntentId || undefined,
    stripeCheckoutSessionId: b.stripeCheckoutSessionId || undefined,
    stripeTransferId: b.stripeTransferId || undefined,
    paymentStatus: b.paymentStatus || 'pending',
    updatedAt: toMs(b.updatedAt) || Date.now(),
  }));
  writeJsonl('bounties', bounties);

  // -----------------------------------------------------------------------
  // Submissions
  // -----------------------------------------------------------------------
  const pgSubs = await readTable('submission');
  const submissions = pgSubs.map((s) => ({
    legacyPgId: s.id,
    _bountyId: s.bountyId,
    _contributorId: s.contributorId,
    description: s.description || '',
    deliverableUrl: s.deliverableUrl || '',
    pullRequestUrl: s.pullRequestUrl || undefined,
    githubPullRequestNumber: s.githubPullRequestNumber ?? undefined,
    githubPullRequestId: s.githubPullRequestId ?? undefined,
    githubCommentId: s.githubCommentId ?? undefined,
    githubUsername: s.githubUsername || undefined,
    githubHeadSha: s.githubHeadSha || undefined,
    pullRequestTitle: s.pullRequestTitle || undefined,
    status: s.status || 'pending',
    reviewNotes: s.reviewNotes || undefined,
    submittedAt: toMs(s.submittedAt || s.createdAt) || Date.now(),
    reviewedAt: toMs(s.reviewedAt),
    updatedAt: toMs(s.updatedAt) || Date.now(),
  }));
  writeJsonl('submissions', submissions);

  // -----------------------------------------------------------------------
  // Bounty Comments
  // -----------------------------------------------------------------------
  const pgComments = await readTable('bounty_comment');
  const comments = pgComments.map((c) => ({
    legacyPgId: c.id,
    _bountyId: c.bountyId,
    _userId: c.userId,
    _parentId: c.parentId || undefined,
    content: c.content || '',
    originalContent: c.originalContent || undefined,
    editCount: Number(c.editCount ?? 0),
    updatedAt: toMs(c.updatedAt) || Date.now(),
  }));
  writeJsonl('bountyComments', comments);

  // -----------------------------------------------------------------------
  // Bounty Votes
  // -----------------------------------------------------------------------
  const pgVotes = await readTable('bounty_vote');
  const votes = pgVotes.map((v) => ({
    _bountyId: v.bountyId,
    _userId: v.userId,
  }));
  writeJsonl('bountyVotes', votes);

  // -----------------------------------------------------------------------
  // Bounty Bookmarks
  // -----------------------------------------------------------------------
  const pgBookmarks = await readTable('bounty_bookmark');
  const bookmarks = pgBookmarks.map((b) => ({
    _bountyId: b.bountyId,
    _userId: b.userId,
  }));
  writeJsonl('bountyBookmarks', bookmarks);

  // -----------------------------------------------------------------------
  // Bounty Links
  // -----------------------------------------------------------------------
  const pgLinks = await readTable('bounty_links');
  const links = pgLinks.map((l) => ({
    _bountyId: l.bountyId,
    url: l.url,
    domain: l.domain,
    displayText: l.displayText || l.url,
    isGitHub: l.isGithub ?? false,
    githubOwner: l.githubOwner || undefined,
    githubRepo: l.githubRepo || undefined,
  }));
  writeJsonl('bountyLinks', links);

  // -----------------------------------------------------------------------
  // Transactions
  // -----------------------------------------------------------------------
  const pgTxns = await readTable('transaction');
  const transactions = pgTxns.map((t) => ({
    _bountyId: t.bountyId,
    type: t.type || 'payment_intent',
    amountCents: { $integer: String(toCentsNum(t.amount)) },
    stripeId: t.stripeId || t.id,
  }));
  writeJsonl('transactions', transactions);

  // -----------------------------------------------------------------------
  // Payouts
  // -----------------------------------------------------------------------
  const pgPayouts = await readTable('payout');
  const payouts = pgPayouts.map((p) => ({
    _userId: p.userId,
    _bountyId: p.bountyId,
    amountCents: { $integer: String(toCentsNum(p.amount)) },
    status: p.status || 'pending',
    stripeTransferId: p.stripeTransferId || undefined,
    updatedAt: toMs(p.updatedAt) || Date.now(),
  }));
  writeJsonl('payouts', payouts);

  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------
  const pgNotifs = await readTable('notification');
  const notifications = pgNotifs.map((n) => ({
    _userId: n.userId,
    type: n.type || 'system',
    title: n.title || '',
    message: n.message || '',
    data: n.data || undefined,
    read: n.read ?? false,
    updatedAt: toMs(n.updatedAt) || Date.now(),
  }));
  writeJsonl('notifications', notifications);

  // -----------------------------------------------------------------------
  // User Profiles
  // -----------------------------------------------------------------------
  const pgProfiles = await readTable('user_profile');
  const userProfiles = pgProfiles.map((p) => ({
    _userId: p.userId,
    bio: p.bio || undefined,
    location: p.location || undefined,
    website: p.website || undefined,
    githubUsername: p.githubUsername || undefined,
    twitterUsername: p.twitterUsername || undefined,
    linkedinUrl: p.linkedinUrl || undefined,
    skills: p.skills || undefined,
    preferredLanguages: p.preferredLanguages || undefined,
    hourlyRateCents: p.hourlyRate
      ? { $integer: String(toCentsNum(p.hourlyRate)) }
      : undefined,
    currency: p.currency || undefined,
    timezone: p.timezone || undefined,
    availableForWork: p.availableForWork ?? undefined,
    updatedAt: toMs(p.updatedAt) || Date.now(),
  }));
  writeJsonl('userProfiles', userProfiles);

  // -----------------------------------------------------------------------
  // User Reputation
  // -----------------------------------------------------------------------
  const pgReps = await readTable('user_reputation');
  const userReputation = pgReps.map((r) => ({
    _userId: r.userId,
    totalEarnedCents: { $integer: String(toCentsNum(r.totalEarned)) },
    bountiesCompleted: Number(r.bountiesCompleted ?? 0),
    bountiesCreated: Number(r.bountiesCreated ?? 0),
    averageRating: Number(r.averageRating ?? 0),
    totalRatings: Number(r.totalRatings ?? 0),
    successRate: Number(r.successRate ?? 0),
    responseTime: r.responseTime ? Number(r.responseTime) : undefined,
    completionRate: Number(r.completionRate ?? 0),
    updatedAt: toMs(r.updatedAt) || Date.now(),
  }));
  writeJsonl('userReputation', userReputation);

  // -----------------------------------------------------------------------
  // GitHub Installations
  // -----------------------------------------------------------------------
  const pgInstalls = await readTable('github_installation');
  const githubInstallations = pgInstalls.map((i) => ({
    githubInstallationId: Number(i.githubInstallationId),
    githubAccountId: i.githubAccountId || undefined,
    accountLogin: i.accountLogin || undefined,
    accountType: i.accountType || undefined,
    accountAvatarUrl: i.accountAvatarUrl || undefined,
    isDefault: i.isDefault ?? false,
    suspendedAt: toMs(i.suspendedAt),
    _organizationId: i.organizationId,
    updatedAt: toMs(i.updatedAt) || Date.now(),
  }));
  writeJsonl('githubInstallations', githubInstallations);

  // -----------------------------------------------------------------------
  // Waitlist
  // -----------------------------------------------------------------------
  const pgWaitlist = await readTable('waitlist');
  const waitlist = pgWaitlist.map((w) => ({
    email: w.email,
    ipAddress: w.ipAddress || undefined,
    otpAttempts: Number(w.otpAttempts ?? 0),
    emailVerified: w.emailVerified ?? false,
    accessToken: w.accessToken || undefined,
    accessGrantedAt: toMs(w.accessGrantedAt),
    bountyTitle: w.bountyTitle || undefined,
    bountyDescription: w.bountyDescription || undefined,
    bountyAmount: w.bountyAmount || undefined,
    bountyDeadline: toMs(w.bountyDeadline),
    bountyGithubIssueUrl: w.bountyGithubIssueUrl || undefined,
    _userId: w.userId,
    position: w.position ? Number(w.position) : undefined,
  }));
  writeJsonl('waitlist', waitlist);

  // -----------------------------------------------------------------------
  // Feature Votes
  // -----------------------------------------------------------------------
  const pgFeatureVotes = await readTable('feature_vote');
  const featureVotes = pgFeatureVotes.map((fv) => ({
    _userId: fv.userId,
    featureType: fv.featureType || 'integration',
    featureKey: fv.featureKey,
  }));
  writeJsonl('featureVotes', featureVotes);

  // -----------------------------------------------------------------------
  // Onboarding State
  // -----------------------------------------------------------------------
  const pgOnboarding = await readTable('onboarding_state');
  const onboardingState = pgOnboarding.map((o) => ({
    _userId: o.userId,
    completedStep1: o.completedStep1 ?? false,
    completedStep2: o.completedStep2 ?? false,
    completedStep3: o.completedStep3 ?? false,
    completedStep4: o.completedStep4 ?? false,
    source: o.source || undefined,
    claimedWaitlistDiscount: o.claimedWaitlistDiscount ?? false,
    updatedAt: toMs(o.updatedAt) || Date.now(),
  }));
  writeJsonl('onboardingState', onboardingState);

  // -----------------------------------------------------------------------
  // Cancellation Requests
  // -----------------------------------------------------------------------
  const pgCancels = await readTable('cancellation_request');
  const cancellationRequests = pgCancels.map((c) => ({
    _bountyId: c.bountyId,
    _requestedById: c.requestedById,
    reason: c.reason || undefined,
    status: c.status || 'pending',
    _processedById: c.processedById || undefined,
    processedAt: toMs(c.processedAt),
    refundAmountCents: c.refundAmount
      ? { $integer: String(toCentsNum(c.refundAmount)) }
      : undefined,
  }));
  writeJsonl('cancellationRequests', cancellationRequests);

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\nExport complete!');
  console.log(`Files written to ${outDir}/`);
  console.log(
    '\nFields prefixed with _ (like _userId, _bountyId) contain PG UUIDs'
  );
  console.log('that need to be resolved to Convex IDs after import.');
  console.log('\nImport order:');
  console.log('  1. npx convex import --table users convex/data/users.jsonl');
  console.log(
    '  2. npx convex import --table organizations convex/data/organizations.jsonl'
  );
  console.log('  3. Then run FK resolution mutations');
  console.log('  4. Import remaining tables');

  await pool.end();
}

main().catch((e) => {
  console.error('Export failed:', e);
  process.exit(1);
});
