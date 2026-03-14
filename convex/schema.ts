import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// ============================================================================
// Validators for enum-like fields (replacing pgEnum)
// ============================================================================

export const bountyStatus = v.union(
  v.literal('draft'),
  v.literal('open'),
  v.literal('in_progress'),
  v.literal('completed'),
  v.literal('cancelled')
);

export const submissionStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('revision_requested')
);

export const paymentStatus = v.union(
  v.literal('pending'),
  v.literal('held'),
  v.literal('released'),
  v.literal('refunded'),
  v.literal('failed')
);

export const cancellationRequestStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('withdrawn')
);

export const transactionType = v.union(
  v.literal('payment_intent'),
  v.literal('transfer'),
  v.literal('refund'),
  v.literal('payout')
);

export const payoutStatus = v.union(
  v.literal('pending'),
  v.literal('processing'),
  v.literal('completed'),
  v.literal('failed')
);

export const notificationType = v.union(
  v.literal('system'),
  v.literal('bounty_comment'),
  v.literal('submission_received'),
  v.literal('submission_approved'),
  v.literal('submission_rejected'),
  v.literal('bounty_awarded'),
  v.literal('beta_application_approved'),
  v.literal('beta_application_rejected'),
  v.literal('custom')
);

export const betaApplicationStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected')
);

export const deviceCodeStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('denied')
);

export const featureType = v.union(v.literal('integration'));

export const orgInvitationStatus = v.union(
  v.literal('pending'),
  v.literal('accepted'),
  v.literal('rejected'),
  v.literal('canceled'),
  v.literal('expired')
);

// ============================================================================
// Schema Definition
// ============================================================================
//
// NOTE: Auth tables (user, session, account, verification, passkey, rateLimit)
// are managed by the @convex-dev/better-auth component in its own namespace.
// Access them via the auth component client, NOT via ctx.db directly.
//
// NOTE: Stripe component tables (customers, subscriptions, checkout_sessions,
// payments, invoices) are managed by @convex-dev/stripe in its own namespace.
//
// NOTE: All money amounts are stored as integer cents (v.int64()) to avoid
// floating-point precision issues. Use convex/lib/money.ts for conversions.
//
// NOTE: Convex auto-generates _id and _creationTime for every document.
// We add explicit updatedAt where needed for business logic.
// ============================================================================

export default defineSchema({
  // --------------------------------------------------------------------------
  // Extended User Data (supplements Better Auth's user table)
  //
  // We store bounty.new-specific fields here since the Better Auth component
  // manages its own user table. Link via betterAuthUserId.
  // --------------------------------------------------------------------------
  users: defineTable({
    // Link to Better Auth component's user ID
    betterAuthUserId: v.string(),

    // Profile fields
    handle: v.optional(v.string()),
    isProfilePrivate: v.boolean(),
    role: v.string(), // "user" | "admin" | "early_access"
    banned: v.boolean(),
    banReason: v.optional(v.string()),
    banExpires: v.optional(v.float64()), // Unix ms

    // Stripe fields
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeConnectOnboardingComplete: v.boolean(),

    // UI preferences
    cardBackground: v.optional(v.string()),

    updatedAt: v.float64(), // Unix ms
  })
    .index('by_betterAuthUserId', ['betterAuthUserId'])
    .index('by_handle', ['handle'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_stripeConnectAccountId', ['stripeConnectAccountId'])
    .searchIndex('search_handle', { searchField: 'handle' }),

  // --------------------------------------------------------------------------
  // User Profiles (extended profile info)
  // --------------------------------------------------------------------------
  userProfiles: defineTable({
    userId: v.id('users'),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    preferredLanguages: v.optional(v.array(v.string())),
    hourlyRateCents: v.optional(v.int64()), // integer cents
    currency: v.optional(v.string()), // default "USD"
    timezone: v.optional(v.string()),
    availableForWork: v.optional(v.boolean()), // default true
    updatedAt: v.float64(),
  })
    .index('by_userId', ['userId'])
    .searchIndex('search_githubUsername', {
      searchField: 'githubUsername',
    }),

  // --------------------------------------------------------------------------
  // User Reputation (aggregated stats)
  // --------------------------------------------------------------------------
  userReputation: defineTable({
    userId: v.id('users'),
    totalEarnedCents: v.int64(), // integer cents
    bountiesCompleted: v.float64(),
    bountiesCreated: v.float64(),
    averageRating: v.float64(), // 0.00 - 5.00
    totalRatings: v.float64(),
    successRate: v.float64(), // 0.00 - 100.00
    responseTime: v.optional(v.float64()), // minutes
    completionRate: v.float64(), // 0.00 - 100.00
    updatedAt: v.float64(),
  }).index('by_userId', ['userId']),

  // --------------------------------------------------------------------------
  // User Ratings (per-bounty ratings between users)
  // --------------------------------------------------------------------------
  userRatings: defineTable({
    ratedUserId: v.id('users'),
    raterUserId: v.id('users'),
    bountyId: v.id('bounties'),
    rating: v.float64(), // 1-5
    comment: v.optional(v.string()),
    updatedAt: v.float64(),
  })
    .index('by_ratedUserId', ['ratedUserId'])
    .index('by_raterUserId', ['raterUserId'])
    .index('by_bountyId', ['bountyId'])
    .index('by_ratedUser_bounty', ['ratedUserId', 'bountyId']),

  // --------------------------------------------------------------------------
  // Organizations (supplements Better Auth's organization table)
  // --------------------------------------------------------------------------
  organizations: defineTable({
    betterAuthOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.string()),
    metadata: v.optional(v.string()),
    isPersonal: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
  })
    .index('by_betterAuthOrgId', ['betterAuthOrgId'])
    .index('by_slug', ['slug'])
    .index('by_stripeCustomerId', ['stripeCustomerId']),

  // --------------------------------------------------------------------------
  // Organization Members (supplements Better Auth's member table)
  // --------------------------------------------------------------------------
  members: defineTable({
    userId: v.id('users'),
    organizationId: v.id('organizations'),
    role: v.string(), // "owner" | "member"
  })
    .index('by_userId', ['userId'])
    .index('by_organizationId', ['organizationId'])
    .index('by_org_user', ['organizationId', 'userId']),

  // --------------------------------------------------------------------------
  // Organization Invitations
  // --------------------------------------------------------------------------
  invitations: defineTable({
    email: v.string(),
    inviterId: v.id('users'),
    organizationId: v.id('organizations'),
    role: v.string(), // "owner" | "member"
    status: orgInvitationStatus,
    expiresAt: v.float64(), // Unix ms
  })
    .index('by_organizationId', ['organizationId'])
    .index('by_email', ['email']),

  // --------------------------------------------------------------------------
  // Bounties (core entity)
  // --------------------------------------------------------------------------
  bounties: defineTable({
    title: v.string(),
    description: v.string(),
    amountCents: v.int64(), // integer cents
    currency: v.string(), // default "USD"
    status: bountyStatus,
    deadline: v.optional(v.float64()), // Unix ms
    tags: v.optional(v.array(v.string())),

    // Repository info
    repositoryUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),

    // GitHub integration
    githubIssueNumber: v.optional(v.float64()),
    githubInstallationId: v.optional(v.float64()),
    githubRepoOwner: v.optional(v.string()),
    githubRepoName: v.optional(v.string()),
    githubCommentId: v.optional(v.float64()),

    // Linear integration
    linearIssueId: v.optional(v.string()),
    linearIssueIdentifier: v.optional(v.string()),
    linearIssueUrl: v.optional(v.string()),
    linearAccountId: v.optional(v.string()),
    linearCommentId: v.optional(v.string()),

    // Submission config
    submissionKeyword: v.optional(v.string()), // default "@bountydotnew submit"

    // Relationships
    organizationId: v.optional(v.id('organizations')),
    createdById: v.id('users'),
    assignedToId: v.optional(v.id('users')),

    // Flags
    isFeatured: v.boolean(),

    // Stripe references
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    paymentStatus: v.optional(paymentStatus),

    updatedAt: v.float64(),
  })
    .index('by_organizationId', ['organizationId'])
    .index('by_createdById', ['createdById'])
    .index('by_assignedToId', ['assignedToId'])
    .index('by_status', ['status'])
    .index('by_paymentStatus', ['paymentStatus'])
    .index('by_linearIssueId', ['linearIssueId'])
    .index('by_stripePaymentIntentId', ['stripePaymentIntentId'])
    .index('by_stripeCheckoutSessionId', ['stripeCheckoutSessionId'])
    .index('by_github_issue', [
      'githubRepoOwner',
      'githubRepoName',
      'githubIssueNumber',
    ])
    .searchIndex('search_title', { searchField: 'title' })
    .searchIndex('search_description', { searchField: 'description' }),

  // --------------------------------------------------------------------------
  // Submissions (PR submissions to bounties)
  // --------------------------------------------------------------------------
  submissions: defineTable({
    bountyId: v.id('bounties'),
    contributorId: v.id('users'),
    description: v.string(),
    deliverableUrl: v.string(),
    pullRequestUrl: v.optional(v.string()),
    githubPullRequestNumber: v.optional(v.float64()),
    githubPullRequestId: v.optional(v.float64()),
    githubCommentId: v.optional(v.float64()),
    githubUsername: v.optional(v.string()),
    githubHeadSha: v.optional(v.string()),
    pullRequestTitle: v.optional(v.string()),
    status: submissionStatus,
    reviewNotes: v.optional(v.string()),
    submittedAt: v.float64(), // Unix ms
    reviewedAt: v.optional(v.float64()),
    updatedAt: v.float64(),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_contributorId', ['contributorId'])
    .index('by_bounty_contributor', ['bountyId', 'contributorId']),

  // --------------------------------------------------------------------------
  // Bounty Links (parsed URLs from descriptions)
  // --------------------------------------------------------------------------
  bountyLinks: defineTable({
    bountyId: v.id('bounties'),
    url: v.string(),
    domain: v.string(),
    displayText: v.string(),
    isGitHub: v.boolean(),
    githubOwner: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
  }).index('by_bountyId', ['bountyId']),

  // --------------------------------------------------------------------------
  // Bounty Applications
  // --------------------------------------------------------------------------
  bountyApplications: defineTable({
    bountyId: v.id('bounties'),
    applicantId: v.id('users'),
    message: v.string(),
    isAccepted: v.optional(v.boolean()),
    appliedAt: v.float64(),
    respondedAt: v.optional(v.float64()),
    updatedAt: v.float64(),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_applicantId', ['applicantId'])
    .index('by_bounty_applicant', ['bountyId', 'applicantId']),

  // --------------------------------------------------------------------------
  // Bounty Votes (upvotes)
  // --------------------------------------------------------------------------
  bountyVotes: defineTable({
    bountyId: v.id('bounties'),
    userId: v.id('users'),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_userId', ['userId'])
    .index('by_bounty_user', ['bountyId', 'userId']),

  // --------------------------------------------------------------------------
  // Bounty Comments (threaded)
  // --------------------------------------------------------------------------
  bountyComments: defineTable({
    bountyId: v.id('bounties'),
    userId: v.id('users'),
    parentId: v.optional(v.id('bountyComments')), // self-referential for threading
    content: v.string(),
    originalContent: v.optional(v.string()),
    editCount: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_userId', ['userId'])
    .index('by_parentId', ['parentId']),

  // --------------------------------------------------------------------------
  // Bounty Comment Likes
  // --------------------------------------------------------------------------
  bountyCommentLikes: defineTable({
    commentId: v.id('bountyComments'),
    userId: v.id('users'),
  })
    .index('by_commentId', ['commentId'])
    .index('by_userId', ['userId'])
    .index('by_comment_user', ['commentId', 'userId']),

  // --------------------------------------------------------------------------
  // Bounty Bookmarks
  // --------------------------------------------------------------------------
  bountyBookmarks: defineTable({
    bountyId: v.id('bounties'),
    userId: v.id('users'),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_userId', ['userId'])
    .index('by_bounty_user', ['bountyId', 'userId']),

  // --------------------------------------------------------------------------
  // Cancellation Requests
  // --------------------------------------------------------------------------
  cancellationRequests: defineTable({
    bountyId: v.id('bounties'),
    requestedById: v.id('users'),
    reason: v.optional(v.string()),
    status: cancellationRequestStatus,
    processedById: v.optional(v.id('users')),
    processedAt: v.optional(v.float64()),
    refundAmountCents: v.optional(v.int64()), // integer cents
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_status', ['status']),

  // --------------------------------------------------------------------------
  // Transactions (Stripe transaction log)
  // --------------------------------------------------------------------------
  transactions: defineTable({
    bountyId: v.id('bounties'),
    type: transactionType,
    amountCents: v.int64(), // integer cents
    stripeId: v.string(),
  })
    .index('by_bountyId', ['bountyId'])
    .index('by_stripeId', ['stripeId']),

  // --------------------------------------------------------------------------
  // Payouts (to contributors)
  // --------------------------------------------------------------------------
  payouts: defineTable({
    userId: v.id('users'),
    bountyId: v.id('bounties'),
    amountCents: v.int64(), // integer cents
    status: payoutStatus,
    stripeTransferId: v.optional(v.string()),
    updatedAt: v.float64(),
  })
    .index('by_userId', ['userId'])
    .index('by_bountyId', ['bountyId'])
    .index('by_stripeTransferId', ['stripeTransferId']),

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------
  notifications: defineTable({
    userId: v.id('users'),
    type: notificationType,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()), // flexible JSON payload
    read: v.boolean(),
    updatedAt: v.float64(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_read', ['userId', 'read'])
    .index('by_type', ['type']),

  // --------------------------------------------------------------------------
  // GitHub Installations
  // --------------------------------------------------------------------------
  githubInstallations: defineTable({
    githubInstallationId: v.float64(),
    githubAccountId: v.optional(v.string()), // Better Auth account ID (string)
    repositoryIds: v.optional(v.array(v.string())),
    accountLogin: v.optional(v.string()),
    accountType: v.optional(v.string()),
    accountAvatarUrl: v.optional(v.string()),
    isDefault: v.boolean(),
    suspendedAt: v.optional(v.float64()),
    organizationId: v.optional(v.id('organizations')),
    updatedAt: v.float64(),
  })
    .index('by_githubInstallationId', ['githubInstallationId'])
    .index('by_githubAccountId', ['githubAccountId'])
    .index('by_organizationId', ['organizationId']),

  // --------------------------------------------------------------------------
  // Linear Accounts
  // --------------------------------------------------------------------------
  linearAccounts: defineTable({
    accountId: v.string(), // Better Auth account ID
    linearUserId: v.string(),
    linearWorkspaceId: v.string(),
    linearWorkspaceName: v.string(),
    linearWorkspaceUrl: v.optional(v.string()),
    linearWorkspaceKey: v.optional(v.string()),
    isActive: v.boolean(),
    organizationId: v.optional(v.id('organizations')),
    updatedAt: v.float64(),
  })
    .index('by_accountId', ['accountId'])
    .index('by_linearWorkspaceId', ['linearWorkspaceId'])
    .index('by_account_workspace', ['accountId', 'linearWorkspaceId'])
    .index('by_organizationId', ['organizationId']),

  // --------------------------------------------------------------------------
  // Discord Guilds
  // --------------------------------------------------------------------------
  discordGuilds: defineTable({
    guildId: v.string(), // Discord guild/server ID
    name: v.string(),
    icon: v.optional(v.string()),
    ownerId: v.string(),
    memberCount: v.optional(v.float64()),
    installedAt: v.float64(),
    installedById: v.optional(v.id('users')),
    removedAt: v.optional(v.float64()),
    organizationId: v.optional(v.id('organizations')),
  })
    .index('by_guildId', ['guildId'])
    .index('by_organizationId', ['organizationId']),

  // --------------------------------------------------------------------------
  // Waitlist
  // --------------------------------------------------------------------------
  waitlist: defineTable({
    email: v.string(),
    ipAddress: v.optional(v.string()),
    otpCode: v.optional(v.string()),
    otpExpiresAt: v.optional(v.float64()),
    otpAttempts: v.float64(),
    emailVerified: v.boolean(),
    accessToken: v.optional(v.string()),
    accessGrantedAt: v.optional(v.float64()),
    // Bounty draft fields
    bountyTitle: v.optional(v.string()),
    bountyDescription: v.optional(v.string()),
    bountyAmount: v.optional(v.string()),
    bountyDeadline: v.optional(v.float64()),
    bountyGithubIssueUrl: v.optional(v.string()),
    userId: v.optional(v.id('users')),
    position: v.optional(v.float64()),
  })
    .index('by_email', ['email'])
    .index('by_userId', ['userId'])
    .index('by_accessToken', ['accessToken']),

  // --------------------------------------------------------------------------
  // Device Codes (OAuth device flow for CLI/mobile)
  // --------------------------------------------------------------------------
  deviceCodes: defineTable({
    deviceCode: v.string(),
    userCode: v.string(),
    userId: v.optional(v.id('users')),
    clientId: v.optional(v.string()),
    scope: v.optional(v.string()),
    status: deviceCodeStatus,
    expiresAt: v.float64(),
    lastPolledAt: v.optional(v.float64()),
    pollingInterval: v.optional(v.float64()),
    updatedAt: v.float64(),
  })
    .index('by_deviceCode', ['deviceCode'])
    .index('by_userCode', ['userCode']),

  // --------------------------------------------------------------------------
  // Email OTP (one-time passcodes)
  // --------------------------------------------------------------------------
  emailOtps: defineTable({
    userId: v.id('users'),
    otpCode: v.string(),
    expiresAt: v.float64(),
    used: v.boolean(),
    verified: v.boolean(),
    updatedAt: v.float64(),
  }).index('by_userId', ['userId']),

  // --------------------------------------------------------------------------
  // OAuth State (CSRF protection)
  // --------------------------------------------------------------------------
  oauthStates: defineTable({
    state: v.string(),
    provider: v.string(),
    providerId: v.optional(v.string()),
    expiresAt: v.float64(),
    used: v.boolean(),
  }).index('by_state', ['state']),

  // --------------------------------------------------------------------------
  // Beta Applications
  // --------------------------------------------------------------------------
  betaApplications: defineTable({
    userId: v.id('users'),
    name: v.string(),
    twitter: v.string(),
    projectName: v.string(),
    projectLink: v.string(),
    description: v.string(),
    status: betaApplicationStatus,
    reviewedBy: v.optional(v.id('users')),
    reviewedAt: v.optional(v.float64()),
    reviewNotes: v.optional(v.string()),
    updatedAt: v.float64(),
  })
    .index('by_userId', ['userId'])
    .index('by_status', ['status']),

  // --------------------------------------------------------------------------
  // Feature Votes
  // --------------------------------------------------------------------------
  featureVotes: defineTable({
    userId: v.id('users'),
    featureType,
    featureKey: v.string(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_featureType', ['userId', 'featureType']),

  // --------------------------------------------------------------------------
  // Invites (external platform invitations)
  // --------------------------------------------------------------------------
  invites: defineTable({
    email: v.string(),
    tokenHash: v.string(),
    expiresAt: v.float64(),
    usedAt: v.optional(v.float64()),
    usedByUserId: v.optional(v.id('users')),
  })
    .index('by_tokenHash', ['tokenHash'])
    .index('by_email', ['email']),

  // --------------------------------------------------------------------------
  // Onboarding State
  // --------------------------------------------------------------------------
  onboardingState: defineTable({
    userId: v.id('users'),
    completedStep1: v.boolean(),
    completedStep2: v.boolean(),
    completedStep3: v.boolean(),
    completedStep4: v.boolean(),
    source: v.optional(v.string()),
    claimedWaitlistDiscount: v.boolean(),
    updatedAt: v.float64(),
  }).index('by_userId', ['userId']),

  // --------------------------------------------------------------------------
  // Onboarding Coupons
  // --------------------------------------------------------------------------
  onboardingCoupons: defineTable({
    userId: v.id('users'),
    code: v.string(),
    used: v.boolean(),
    expiresAt: v.optional(v.float64()),
  })
    .index('by_userId', ['userId'])
    .index('by_code', ['code']),
});
