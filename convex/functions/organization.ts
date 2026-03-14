/**
 * Organization functions.
 *
 * Replaces: packages/api/src/routers/organization.ts (5 procedures)
 */
import { query, mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth, requireOrgMember, requireOrgOwner } from '../lib/auth';
import { authComponent } from '../auth';

// Reserved slugs that cannot be used by organizations
const RESERVED_SLUGS = [
  'admin',
  'api',
  'auth',
  'bounty',
  'bounties',
  'dashboard',
  'settings',
  'profile',
  'integrations',
  'help',
  'support',
  'blog',
  'docs',
  'about',
  'pricing',
  'terms',
  'privacy',
  'login',
  'signup',
  'register',
];

/**
 * List all organizations the current user is a member of.
 * Replaces: organization.listMyOrgs (protectedProcedure query)
 */
export const listMyOrgs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const memberships = await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        if (!org) return null;

        // Count members
        const members = await ctx.db
          .query('members')
          .withIndex('by_organizationId', (q) =>
            q.eq('organizationId', org._id)
          )
          .collect();

        return {
          ...org,
          memberCount: members.length,
          role: membership.role,
        };
      })
    );

    return orgs.filter(Boolean);
  },
});

/**
 * Get the active organization details.
 * Replaces: organization.getActiveOrg (orgProcedure query)
 */
export const getActiveOrg = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgMember(ctx, args.organizationId as any);

    const members = await ctx.db
      .query('members')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    return {
      ...result.org,
      memberCount: members.length,
      role: result.membership.role,
    };
  },
});

/**
 * Get members of the active organization.
 * Replaces: organization.getMembers (orgProcedure query)
 */
export const getMembers = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgMember(ctx, args.organizationId as any);

    const memberships = await ctx.db
      .query('members')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        const authUser = await authComponent.getAnyUserById(
          ctx,
          user.betterAuthUserId
        );

        return {
          _id: membership._id,
          userId: user._id,
          handle: user.handle,
          name: authUser?.name,
          email: authUser?.email,
          image: authUser?.image,
          role: membership.role,
          joinedAt: membership._creationTime,
        };
      })
    );

    return members.filter(Boolean);
  },
});

/**
 * Update the organization's slug.
 * Replaces: organization.updateSlug (orgOwnerProcedure mutation)
 */
export const updateSlug = mutation({
  args: {
    organizationId: v.optional(v.id('organizations')),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await requireOrgOwner(ctx, args.organizationId as any);

    const slug = args.slug.toLowerCase();

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new ConvexError('INVALID_SLUG_FORMAT');
    }

    if (slug.length < 3 || slug.length > 50) {
      throw new ConvexError('SLUG_LENGTH_INVALID');
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.includes(slug)) {
      throw new ConvexError('SLUG_RESERVED');
    }

    // Check uniqueness
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();

    if (existing && existing._id !== result.org._id) {
      throw new ConvexError('SLUG_TAKEN');
    }

    await ctx.db.patch(result.org._id, { slug });
  },
});

/**
 * Delete the organization.
 * Replaces: organization.deleteOrg (orgOwnerProcedure mutation)
 */
export const deleteOrg = mutation({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgOwner(ctx, args.organizationId as any);

    // Cannot delete personal team
    if (result.org.isPersonal) {
      throw new ConvexError('CANNOT_DELETE_PERSONAL_ORG');
    }

    // Check if there are other members
    const members = await ctx.db
      .query('members')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    if (members.length > 1) {
      throw new ConvexError('ORG_HAS_MEMBERS');
    }

    // Delete memberships
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete invitations
    const invitations = await ctx.db
      .query('invitations')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Delete the org
    await ctx.db.delete(result.org._id);
  },
});

/**
 * Check org bounty status before deletion (are there funded/active bounties?).
 * Replaces: organization.getOrgBountyStatusForDeletion (orgOwnerProcedure query)
 */
export const getOrgBountyStatusForDeletion = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgOwner(ctx, args.organizationId as any);

    // Personal orgs can't be deleted
    if (result.org.isPersonal) {
      return {
        activeBounties: 0,
        fundedBounties: 0,
        approvedSubmissionBounties: 0,
        totalSubmissions: 0,
        canDelete: false,
        blockReason: 'personal',
        bounties: [] as any[],
      };
    }

    // Get all active bounties for this org
    const allBounties = await ctx.db
      .query('bounties')
      .withIndex('by_organizationId', (q: any) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    const activeBounties = allBounties.filter(
      (b: any) => b.status === 'open' || b.status === 'in_progress'
    );

    // Check submissions for each active bounty
    const bountyDetails = await Promise.all(
      activeBounties.map(async (b: any) => {
        const subs = await ctx.db
          .query('submissions')
          .withIndex('by_bountyId', (q: any) => q.eq('bountyId', b._id))
          .collect();

        const approvedCount = subs.filter(
          (s: any) => s.status === 'approved'
        ).length;
        const isFunded =
          b.paymentStatus === 'held' && !!b.stripePaymentIntentId;

        return {
          id: b._id,
          title: b.title,
          isFunded,
          hasApprovedSubmission: approvedCount > 0,
          submissionCount: subs.length,
          amount: String(Number(b.amountCents) / 100),
          status: b.status,
        };
      })
    );

    const fundedBounties = bountyDetails.filter((b) => b.isFunded);
    const approvedSubmissionBounties = bountyDetails.filter(
      (b) => b.hasApprovedSubmission
    );
    const totalSubmissions = bountyDetails.reduce(
      (sum, b) => sum + b.submissionCount,
      0
    );

    let canDelete = true;
    let blockReason: string | null = null;

    if (fundedBounties.length > 0) {
      canDelete = false;
      blockReason = 'funded_bounties';
    } else if (approvedSubmissionBounties.length > 0) {
      canDelete = false;
      blockReason = 'approved_submissions';
    }

    return {
      activeBounties: activeBounties.length,
      fundedBounties: fundedBounties.length,
      approvedSubmissionBounties: approvedSubmissionBounties.length,
      totalSubmissions,
      canDelete,
      blockReason,
      bounties: bountyDetails,
    };
  },
});
