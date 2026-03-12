/**
 * Organization (Team) tRPC Router
 *
 * Supplementary queries for org data. Core CRUD and switching is handled
 * by Better Auth's organization plugin directly (authClient.organization.*).
 *
 * This router provides:
 * - List user's orgs with member counts
 * - Get active org details
 * - Get org members
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  protectedProcedure,
  orgProcedure,
  orgOwnerProcedure,
  router,
} from '../trpc';
import { bounty, member, organization, submission, user } from '@bounty/db';
import { eq, and, sql, count, ne, inArray } from 'drizzle-orm';
import { isReservedSlug } from '@bounty/types/auth';
import {
  FROM_ADDRESSES,
  sendEmail,
  BountyCancellationNotice,
} from '@bounty/email';
import { bountyCancelledByOrgDeletionComment } from '../lib/bot-comments';

export const organizationRouter = router({
  /**
   * List all organizations the current user is a member of.
   * Returns org details + the user's role in each + member count.
   */
  listMyOrgs: protectedProcedure.query(async ({ ctx }) => {
    const orgs = await ctx.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        isPersonal: organization.isPersonal,
        createdAt: organization.createdAt,
        role: member.role,
        memberCount: sql<number>`(
          SELECT count(*)::int FROM ${member} m2
          WHERE m2.organization_id = ${organization.id}
        )`,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, ctx.session.user.id))
      .orderBy(organization.createdAt);

    return {
      success: true,
      orgs,
    };
  }),

  /**
   * Get the active organization's details.
   * Uses the orgProcedure middleware which validates activeOrganizationId.
   */
  getActiveOrg: orgProcedure.query(async ({ ctx }) => {
    // ctx.org is already populated by orgProcedure middleware
    const memberCount = await ctx.db
      .select({ count: count() })
      .from(member)
      .where(eq(member.organizationId, ctx.org.id));

    return {
      success: true,
      org: {
        id: ctx.org.id,
        name: ctx.org.name,
        slug: ctx.org.slug,
        logo: ctx.org.logo,
        isPersonal: ctx.org.isPersonal,
        createdAt: ctx.org.createdAt,
      },
      role: ctx.orgMembership.role,
      memberCount: memberCount[0]?.count ?? 0,
    };
  }),

  /**
   * Get members of the active organization.
   */
  getMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.execute<{
      id: string;
      user_id: string;
      role: string;
      created_at: Date;
      user_name: string | null;
      user_image: string | null;
      user_handle: string | null;
    }>(sql`
      SELECT
        m.id,
        m.user_id,
        m.role,
        m.created_at,
        u.name as user_name,
        u.image as user_image,
        u.handle as user_handle
      FROM ${member} m
      INNER JOIN "user" u ON u.id = m.user_id
      WHERE m.organization_id = ${ctx.org.id}
      ORDER BY m.created_at ASC
    `);

    return {
      success: true,
      members: members.rows.map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        createdAt: m.created_at,
        user: {
          name: m.user_name,
          image: m.user_image,
          handle: m.user_handle,
        },
      })),
    };
  }),

  /**
   * Get bounty status for org deletion.
   * Returns a summary of active bounties and whether deletion is blocked.
   */
  getOrgBountyStatusForDeletion: orgOwnerProcedure.query(async ({ ctx }) => {
    if (ctx.org.isPersonal) {
      return {
        activeBounties: 0,
        fundedBounties: 0,
        approvedSubmissionBounties: 0,
        freeBountiesWithSubmissions: 0,
        totalSubmissions: 0,
        canDelete: false,
        blockReason: 'personal',
        bounties: [] as Array<{
          id: string;
          title: string;
          isFunded: boolean;
          hasApprovedSubmission: boolean;
          submissionCount: number;
          amount: string;
          status: string;
        }>,
      };
    }

    // Get all active bounties (not draft, not completed, not cancelled) for this org
    const activeBounties = await ctx.db
      .select({
        id: bounty.id,
        title: bounty.title,
        amount: bounty.amount,
        status: bounty.status,
        paymentStatus: bounty.paymentStatus,
        stripePaymentIntentId: bounty.stripePaymentIntentId,
        githubIssueNumber: bounty.githubIssueNumber,
        githubInstallationId: bounty.githubInstallationId,
        githubRepoOwner: bounty.githubRepoOwner,
        githubRepoName: bounty.githubRepoName,
        githubCommentId: bounty.githubCommentId,
      })
      .from(bounty)
      .where(
        and(
          eq(bounty.organizationId, ctx.org.id),
          inArray(bounty.status, ['open', 'in_progress'])
        )
      );

    // For each active bounty, check submissions
    const bountyIds = activeBounties.map((b) => b.id);
    let submissionsByBounty: Record<
      string,
      { total: number; approved: number }
    > = {};

    if (bountyIds.length > 0) {
      const submissionStats = await ctx.db
        .select({
          bountyId: submission.bountyId,
          total: count(),
          approved: sql<number>`count(*) filter (where ${submission.status} = 'approved')`,
        })
        .from(submission)
        .where(inArray(submission.bountyId, bountyIds))
        .groupBy(submission.bountyId);

      for (const stat of submissionStats) {
        submissionsByBounty[stat.bountyId] = {
          total: stat.total,
          approved: stat.approved,
        };
      }
    }

    const bountyDetails = activeBounties.map((b) => {
      const isFunded =
        b.paymentStatus === 'held' && !!b.stripePaymentIntentId;
      const stats = submissionsByBounty[b.id] || { total: 0, approved: 0 };
      return {
        id: b.id,
        title: b.title,
        isFunded,
        hasApprovedSubmission: stats.approved > 0,
        submissionCount: stats.total,
        amount: b.amount,
        status: b.status!,
      };
    });

    const fundedBounties = bountyDetails.filter((b) => b.isFunded);
    const approvedSubmissionBounties = bountyDetails.filter(
      (b) => b.hasApprovedSubmission
    );
    const freeBountiesWithSubmissions = bountyDetails.filter(
      (b) => !b.isFunded && b.submissionCount > 0
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
      freeBountiesWithSubmissions: freeBountiesWithSubmissions.length,
      totalSubmissions,
      canDelete,
      blockReason,
      bounties: bountyDetails,
    };
  }),

  /**
   * Update organization slug.
   * Only owners can update the slug.
   */
  updateSlug: orgOwnerProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(2, 'Slug must be at least 2 characters')
          .max(32, 'Slug must be at most 32 characters')
          .regex(
            /^[a-z0-9-]+$/,
            'Slug can only contain lowercase letters, numbers, and hyphens'
          )
          .refine((val) => !val.startsWith('-'), 'Slug cannot start with a hyphen')
          .refine((val) => !val.endsWith('-'), 'Slug cannot end with a hyphen')
          .refine(
            (val) => !/--/.test(val),
            'Slug cannot contain consecutive hyphens'
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { slug } = input;

      // Check if slug is reserved
      if (isReservedSlug(slug)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This slug is reserved and cannot be used.',
        });
      }

      // Check if slug is already taken by another org
      const existing = await ctx.db
        .select({ id: organization.id })
        .from(organization)
        .where(
          and(
            eq(organization.slug, slug),
            ne(organization.id, ctx.org.id)
          )
        )
        .then((rows) => rows[0]);

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This slug is already taken.',
        });
      }

      // Update the slug
      await ctx.db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, ctx.org.id));

      return { success: true, slug };
    }),

  /**
   * Delete organization.
   * Only owners can delete the organization.
   * Personal teams cannot be deleted.
   * Blocks if there are funded bounties or bounties with approved submissions.
   * For free bounties with submissions, emails all submitters and updates GitHub.
   */
  deleteOrg: orgOwnerProcedure
    .input(
      z
        .object({
          /** User must confirm they understand bounties will be cancelled */
          confirmBountyCancellation: z.boolean().optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent deletion of personal teams
      if (ctx.org.isPersonal) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Personal teams cannot be deleted.',
        });
      }

      // Check member count
      const memberCount = await ctx.db
        .select({ count: count() })
        .from(member)
        .where(eq(member.organizationId, ctx.org.id));

      if ((memberCount[0]?.count ?? 0) > 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot delete organization with multiple members. Remove all members first.',
        });
      }

      // Check active bounties
      const activeBounties = await ctx.db
        .select({
          id: bounty.id,
          title: bounty.title,
          amount: bounty.amount,
          status: bounty.status,
          paymentStatus: bounty.paymentStatus,
          stripePaymentIntentId: bounty.stripePaymentIntentId,
          githubIssueNumber: bounty.githubIssueNumber,
          githubInstallationId: bounty.githubInstallationId,
          githubRepoOwner: bounty.githubRepoOwner,
          githubRepoName: bounty.githubRepoName,
          githubCommentId: bounty.githubCommentId,
        })
        .from(bounty)
        .where(
          and(
            eq(bounty.organizationId, ctx.org.id),
            inArray(bounty.status, ['open', 'in_progress'])
          )
        );

      // Check for funded bounties - BLOCK
      const fundedBounties = activeBounties.filter(
        (b) => b.paymentStatus === 'held' && !!b.stripePaymentIntentId
      );

      if (fundedBounties.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete organization with ${fundedBounties.length} funded ${fundedBounties.length === 1 ? 'bounty' : 'bounties'}. Resolve or cancel them first.`,
        });
      }

      // Check for bounties with approved submissions - BLOCK
      if (activeBounties.length > 0) {
        const bountyIds = activeBounties.map((b) => b.id);
        const approvedSubmissions = await ctx.db
          .select({
            bountyId: submission.bountyId,
          })
          .from(submission)
          .where(
            and(
              inArray(submission.bountyId, bountyIds),
              eq(submission.status, 'approved')
            )
          )
          .limit(1);

        if (approvedSubmissions.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot delete organization with bounties that have approved submissions. Resolve or cancel those bounties first.',
          });
        }
      }

      // Check for bounties with any submissions (requires confirm toggle)
      let hasSubmissions = false;
      if (activeBounties.length > 0) {
        const bountyIds = activeBounties.map((b) => b.id);
        const [subCount] = await ctx.db
          .select({ count: count() })
          .from(submission)
          .where(inArray(submission.bountyId, bountyIds));

        hasSubmissions = (subCount?.count ?? 0) > 0;
      }

      // If there are active bounties with submissions, require confirmation toggle
      if (hasSubmissions && !input?.confirmBountyCancellation) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'You must confirm that you understand active bounties with submissions will be cancelled.',
        });
      }

      // Before deleting, handle cleanup for active bounties with submissions
      if (activeBounties.length > 0 && hasSubmissions) {
        const bountyIds = activeBounties.map((b) => b.id);

        // Get all submitters to email
        const submitters = await ctx.db
          .select({
            email: user.email,
            name: user.name,
            bountyId: submission.bountyId,
          })
          .from(submission)
          .innerJoin(user, eq(submission.contributorId, user.id))
          .where(
            and(
              inArray(submission.bountyId, bountyIds),
              inArray(submission.status, ['pending', 'revision_requested'])
            )
          );

        // Get creator info
        const [creator] = await ctx.db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, ctx.session.user.id))
          .limit(1);

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
        const creatorName = creator?.name || 'The bounty creator';

        // Email all submitters
        const emailPromises = submitters
          .filter(
            (s): s is typeof s & { email: string } => Boolean(s.email)
          )
          .map((submitter) => {
            const matchingBounty = activeBounties.find(
              (b) => b.id === submitter.bountyId
            );
            return sendEmail({
              from: FROM_ADDRESSES.notifications,
              to: submitter.email,
              subject: `Bounty Cancelled: ${matchingBounty?.title || 'Bounty'}`,
              react: BountyCancellationNotice({
                bountyTitle: matchingBounty?.title || 'Bounty',
                bountyUrl: `${baseUrl}/bounty/${submitter.bountyId}`,
                creatorName,
                bountyAmount:
                  Number(matchingBounty?.amount || 0) > 0
                    ? `$${Number(matchingBounty?.amount || 0).toLocaleString()}`
                    : 'Free',
                userName: submitter.name || undefined,
              }),
            }).catch((err) => {
              console.error(
                `[OrgDelete] Failed to email submitter ${submitter.email}:`,
                err
              );
            });
          });

        await Promise.allSettled(emailPromises);

        // Update GitHub issues for bounties with GitHub integration
        const githubBounties = activeBounties.filter(
          (b) =>
            b.githubIssueNumber &&
            b.githubInstallationId &&
            b.githubRepoOwner &&
            b.githubRepoName
        );

        if (githubBounties.length > 0) {
          try {
            const { getGithubAppManager } = await import(
              '@bounty/api/driver/github-app'
            );
            const ghApp = getGithubAppManager();
            const orgName = ctx.org.name || ctx.org.slug;

            for (const ghBounty of githubBounties) {
              try {
                // Edit the main bot comment to indicate cancellation
                if (ghBounty.githubCommentId) {
                  await ghApp.editComment(
                    ghBounty.githubInstallationId!,
                    ghBounty.githubRepoOwner!,
                    ghBounty.githubRepoName!,
                    ghBounty.githubCommentId,
                    bountyCancelledByOrgDeletionComment(
                      ghBounty.id,
                      orgName
                    )
                  );
                } else {
                  // No existing comment, create one
                  await ghApp.createIssueComment(
                    ghBounty.githubInstallationId!,
                    ghBounty.githubRepoOwner!,
                    ghBounty.githubRepoName!,
                    ghBounty.githubIssueNumber!,
                    bountyCancelledByOrgDeletionComment(
                      ghBounty.id,
                      orgName
                    )
                  );
                }
              } catch (ghErr) {
                console.error(
                  `[OrgDelete] Failed to update GitHub issue for bounty ${ghBounty.id}:`,
                  ghErr
                );
              }
            }
          } catch (ghErr) {
            console.error(
              '[OrgDelete] Failed to initialize GitHub App manager:',
              ghErr
            );
          }
        }
      }

      // Delete the organization (cascade will handle bounties, members, invitations)
      await ctx.db
        .delete(organization)
        .where(eq(organization.id, ctx.org.id));

      return { success: true };
    }),
});
