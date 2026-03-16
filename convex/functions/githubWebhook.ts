/**
 * GitHub webhook internal mutations/queries.
 *
 * These are called by the HTTP action in http.ts to perform
 * DB operations during webhook processing. Separated from the
 * HTTP action because actions can't access ctx.db directly.
 */
import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Find a bounty linked to a specific GitHub issue. */
export const findBountyForIssue = internalQuery({
  args: {
    issueNumber: v.float64(),
    owner: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bounties')
      .withIndex('by_github_issue', (q) =>
        q
          .eq('githubRepoOwner', args.owner)
          .eq('githubRepoName', args.repo)
          .eq('githubIssueNumber', args.issueNumber)
      )
      .first();
  },
});

/** Find a user by their GitHub login (handle or profile githubUsername). */
export const findUserByGithubLogin = internalQuery({
  args: { login: v.string() },
  handler: async (ctx, args) => {
    // Try by handle first
    const byHandle = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', args.login.toLowerCase()))
      .unique();

    if (byHandle) return byHandle;

    // Try by profile githubUsername
    const profiles = await ctx.db
      .query('userProfiles')
      .withSearchIndex('search_githubUsername', (q) =>
        q.search('githubUsername', args.login)
      )
      .take(5);

    for (const profile of profiles) {
      if (profile.githubUsername?.toLowerCase() === args.login.toLowerCase()) {
        return await ctx.db.get(profile.userId);
      }
    }

    return null;
  },
});

/** Find a submission by bounty ID and PR number. */
export const findSubmissionByPr = internalQuery({
  args: {
    bountyId: v.id('bounties'),
    prNumber: v.float64(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .filter((q) => q.eq(q.field('githubPullRequestNumber'), args.prNumber))
      .first();
  },
});

/** Count pending submissions for a user on a bounty. */
export const countPendingSubmissions = internalQuery({
  args: {
    bountyId: v.id('bounties'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query('submissions')
      .withIndex('by_bounty_contributor', (q) =>
        q.eq('bountyId', args.bountyId).eq('contributorId', args.userId)
      )
      .collect();

    return subs.filter((s) => s.status === 'pending').length;
  },
});

/** Get a GitHub installation by installation ID. */
export const findInstallation = internalQuery({
  args: { installationId: v.float64() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('githubInstallations')
      .withIndex('by_githubInstallationId', (q) =>
        q.eq('githubInstallationId', args.installationId)
      )
      .unique();
  },
});

/** Check if a pending cancellation request exists for a bounty. */
export const hasPendingCancellation = internalQuery({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query('cancellationRequests')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first();
    return !!request;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a bounty from a /create bot command. */
export const createBountyFromCommand = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    amountCents: v.int64(),
    currency: v.string(),
    createdById: v.id('users'),
    organizationId: v.optional(v.id('organizations')),
    githubIssueNumber: v.float64(),
    githubInstallationId: v.float64(),
    githubRepoOwner: v.string(),
    githubRepoName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('bounties', {
      title: args.title,
      description: args.description,
      amountCents: args.amountCents,
      currency: args.currency,
      status: 'draft',
      paymentStatus: 'pending',
      isFeatured: false,
      createdById: args.createdById,
      organizationId: args.organizationId,
      githubIssueNumber: args.githubIssueNumber,
      githubInstallationId: args.githubInstallationId,
      githubRepoOwner: args.githubRepoOwner,
      githubRepoName: args.githubRepoName,
      updatedAt: Date.now(),
    });
  },
});

/** Set the GitHub comment ID on a bounty. */
export const setBountyGithubCommentId = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    githubCommentId: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bountyId, {
      githubCommentId: args.githubCommentId,
      updatedAt: Date.now(),
    });
  },
});

/** Create a submission from a PR (bot command or auto-submit). */
export const createSubmission = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    contributorId: v.id('users'),
    description: v.string(),
    pullRequestUrl: v.string(),
    prNumber: v.float64(),
    githubUsername: v.string(),
    githubHeadSha: v.optional(v.string()),
    pullRequestTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('submissions', {
      bountyId: args.bountyId,
      contributorId: args.contributorId,
      description: args.description,
      deliverableUrl: args.pullRequestUrl,
      pullRequestUrl: args.pullRequestUrl,
      githubPullRequestNumber: args.prNumber,
      githubUsername: args.githubUsername,
      githubHeadSha: args.githubHeadSha,
      pullRequestTitle: args.pullRequestTitle,
      status: 'pending',
      submittedAt: now,
      updatedAt: now,
    });
  },
});

/** Set the GitHub comment ID on a submission. */
export const setSubmissionGithubCommentId = internalMutation({
  args: {
    submissionId: v.id('submissions'),
    githubCommentId: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, {
      githubCommentId: args.githubCommentId,
      updatedAt: Date.now(),
    });
  },
});

/** Delete a submission (for /unsubmit). */
export const deleteSubmission = internalMutation({
  args: { submissionId: v.id('submissions') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.submissionId);
  },
});

/** Approve a submission (for /approve). */
export const approveSubmissionFromWebhook = internalMutation({
  args: {
    submissionId: v.id('submissions'),
    bountyId: v.id('bounties'),
    solverId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: 'approved',
      reviewedAt: now,
      updatedAt: now,
    });

    const bounty = await ctx.db.get(args.bountyId);
    if (bounty && bounty.status === 'open') {
      await ctx.db.patch(args.bountyId, {
        status: 'in_progress',
        assignedToId: args.solverId,
        updatedAt: now,
      });
    }
  },
});

/** Unapprove a submission (for /unapprove). */
export const unapproveSubmissionFromWebhook = internalMutation({
  args: {
    submissionId: v.id('submissions'),
    bountyId: v.id('bounties'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: 'pending',
      reviewedAt: undefined,
      updatedAt: now,
    });

    // Revert bounty to open if no other approved submissions
    const otherApproved = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .first();

    if (!otherApproved) {
      const bounty = await ctx.db.get(args.bountyId);
      if (bounty && bounty.status === 'in_progress') {
        await ctx.db.patch(args.bountyId, {
          status: 'open',
          assignedToId: undefined,
          updatedAt: now,
        });
      }
    }
  },
});

/** Reapprove: unapprove current, approve new (for /reapprove). */
export const reapproveSubmission = internalMutation({
  args: {
    currentApprovedId: v.optional(v.id('submissions')),
    newSubmissionId: v.id('submissions'),
    bountyId: v.id('bounties'),
    solverId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Unapprove current if exists
    if (args.currentApprovedId) {
      await ctx.db.patch(args.currentApprovedId, {
        status: 'pending',
        reviewedAt: undefined,
        updatedAt: now,
      });
    }

    // Approve new
    await ctx.db.patch(args.newSubmissionId, {
      status: 'approved',
      reviewedAt: now,
      updatedAt: now,
    });

    // Update bounty
    await ctx.db.patch(args.bountyId, {
      status: 'in_progress',
      assignedToId: args.solverId,
      updatedAt: now,
    });
  },
});

/**
 * Finalize a merge with payout (for /merge and auto-merge on PR merge).
 * This is the DB-side of the payment — the Stripe transfer happens in the action.
 */
export const finalizeMergeFromWebhook = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
    solverId: v.id('users'),
    transferId: v.string(),
    amountCents: v.int64(),
    isFreeBounty: v.boolean(),
    needsImplicitApproval: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Approve submission if needed (implicit approval on PR merge)
    if (args.needsImplicitApproval) {
      await ctx.db.patch(args.submissionId, {
        status: 'approved',
        reviewedAt: now,
        updatedAt: now,
      });
    }

    // Insert payout
    await ctx.db.insert('payouts', {
      userId: args.solverId,
      bountyId: args.bountyId,
      amountCents: args.amountCents,
      status: args.isFreeBounty ? 'completed' : 'processing',
      stripeTransferId: args.transferId,
      updatedAt: now,
    });

    // Insert transaction
    await ctx.db.insert('transactions', {
      bountyId: args.bountyId,
      type: 'transfer',
      amountCents: args.amountCents,
      stripeId: args.transferId,
    });

    // Update bounty
    await ctx.db.patch(args.bountyId, {
      status: 'completed',
      paymentStatus: 'released',
      stripeTransferId: args.transferId,
      assignedToId: args.solverId,
      updatedAt: now,
    });
  },
});

/** Move a bounty to a different GitHub issue (for /move). */
export const moveBounty = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    newIssueNumber: v.float64(),
    newTitle: v.string(),
    newDescription: v.string(),
    newGithubCommentId: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bountyId, {
      githubIssueNumber: args.newIssueNumber,
      title: args.newTitle,
      description: args.newDescription,
      githubCommentId: args.newGithubCommentId,
      updatedAt: Date.now(),
    });
  },
});

/** Sync bounty title/description from edited GitHub issue. */
export const syncBountyFromIssue = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bountyId, {
      title: args.title,
      description: args.description,
      updatedAt: Date.now(),
    });
  },
});

/** Handle deleted GitHub issue — delete unfunded or orphan funded bounty. */
export const handleIssueDeleted = internalMutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return;

    const isFunded =
      bounty.stripePaymentIntentId && bounty.paymentStatus === 'held';

    if (isFunded) {
      // Orphan the bounty — clear GitHub link fields
      await ctx.db.patch(args.bountyId, {
        githubIssueNumber: undefined,
        githubInstallationId: undefined,
        githubRepoOwner: undefined,
        githubRepoName: undefined,
        githubCommentId: undefined,
        updatedAt: Date.now(),
      });
    } else {
      // Delete unfunded bounty
      await ctx.db.delete(args.bountyId);
    }
  },
});

/** Upsert a GitHub installation record. */
export const upsertGithubInstallation = internalMutation({
  args: {
    githubInstallationId: v.float64(),
    accountLogin: v.optional(v.string()),
    accountType: v.optional(v.string()),
    accountAvatarUrl: v.optional(v.string()),
    repositoryIds: v.optional(v.array(v.string())),
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('githubInstallations')
      .withIndex('by_githubInstallationId', (q) =>
        q.eq('githubInstallationId', args.githubInstallationId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      const patch: Record<string, unknown> = { updatedAt: now };
      if (args.accountLogin !== undefined)
        patch.accountLogin = args.accountLogin;
      if (args.accountType !== undefined) patch.accountType = args.accountType;
      if (args.accountAvatarUrl !== undefined)
        patch.accountAvatarUrl = args.accountAvatarUrl;
      if (args.repositoryIds !== undefined)
        patch.repositoryIds = args.repositoryIds;
      // Never overwrite organizationId on update
      await ctx.db.patch(existing._id, patch);
    } else {
      const doc: Record<string, unknown> = {
        githubInstallationId: args.githubInstallationId,
        isDefault: false,
        updatedAt: now,
      };
      if (args.accountLogin !== undefined) doc.accountLogin = args.accountLogin;
      if (args.accountType !== undefined) doc.accountType = args.accountType;
      if (args.accountAvatarUrl !== undefined)
        doc.accountAvatarUrl = args.accountAvatarUrl;
      if (args.repositoryIds !== undefined)
        doc.repositoryIds = args.repositoryIds;
      if (args.organizationId !== undefined)
        doc.organizationId = args.organizationId;

      await ctx.db.insert(
        'githubInstallations',
        doc as typeof doc & {
          githubInstallationId: number;
          isDefault: boolean;
          updatedAt: number;
        }
      );
    }
  },
});

/** Delete a GitHub installation record. */
export const deleteGithubInstallation = internalMutation({
  args: { githubInstallationId: v.float64() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('githubInstallations')
      .withIndex('by_githubInstallationId', (q) =>
        q.eq('githubInstallationId', args.githubInstallationId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/** Find user's personal org for bounty creation. */
export const findPersonalOrg = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();

    for (const m of memberships) {
      const org = await ctx.db.get(m.organizationId);
      if (org && org.isPersonal) return org;
    }

    return null;
  },
});

/** Get submission count for a bounty (for updating bot comment). */
export const getSubmissionCount = internalQuery({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .collect();
    return subs.length;
  },
});

/** Find the currently approved submission for a bounty. */
export const findApprovedSubmission = internalQuery({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .first();
  },
});
