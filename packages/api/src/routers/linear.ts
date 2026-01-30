import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  protectedProcedure,
  router,
  rateLimitedProtectedProcedure,
} from '../trpc';
import { linearAccount, account } from '@bounty/db';
import { eq, and } from 'drizzle-orm';
import {
  createLinearDriver,
  LINEAR_COMMENT_TEMPLATES,
} from '../../driver/linear-client';

/**
 * Helper function to get the user's Linear OAuth account
 */
async function getLinearAccount(db: any, userId: string) {
  const [linearOAuthAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'linear')))
    .limit(1);

  return linearOAuthAccount;
}

/**
 * Helper function to get the Linear workspace connection for a user
 */
async function getLinearWorkspace(db: any, oauthAccountId: string) {
  const [linearWorkspace] = await db
    .select()
    .from(linearAccount)
    .where(
      and(
        eq(linearAccount.accountId, oauthAccountId),
        eq(linearAccount.isActive, true)
      )
    )
    .limit(1);

  return linearWorkspace;
}

export const linearRouter = router({
  /**
   * Check if user has Linear OAuth account (for sync detection)
   */
  getAccountStatus: protectedProcedure.query(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );
    return {
      success: true,
      hasOAuth: !!linearOAuthAccount,
    };
  }),

  /**
   * Get all Linear workspaces for the current user
   */
  getWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    // Get the user's Linear OAuth account
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
      return { success: true, workspaces: [] };
    }

    // Get the Linear workspace connection
    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id
    );

    if (!linearWorkspace) {
      return { success: true, workspaces: [] };
    }

    try {
      const driver = createLinearDriver(linearOAuthAccount.accessToken);
      const workspace = await driver.getCurrentWorkspace();

      return {
        success: true,
        workspaces: workspace
          ? [
              {
                id: workspace.id,
                name: workspace.name,
                key: workspace.key,
                url: workspace.url,
              },
            ]
          : [],
      };
    } catch (error) {
      console.error('Failed to fetch Linear workspaces:', error);
      return { success: true, workspaces: [] };
    }
  }),

  /**
   * Get connection status (whether user has connected Linear)
   */
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount) {
      return { success: true, connected: false, workspace: null };
    }

    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id
    );

    return {
      success: true,
      connected: !!linearWorkspace,
      workspace: linearWorkspace
        ? {
            id: linearWorkspace.linearWorkspaceId,
            name: linearWorkspace.linearWorkspaceName,
            key: linearWorkspace.linearWorkspaceKey,
            url: linearWorkspace.linearWorkspaceUrl,
          }
        : null,
    };
  }),

  /**
   * Fetch issues from Linear with optional filters
   */
  getIssues: rateLimitedProtectedProcedure('linear:read')
    .input(
      z.object({
        filters: z
          .object({
            status: z.array(z.string()).optional(),
            priority: z.array(z.number()).optional(),
            assigneeId: z.string().optional(),
            projectId: z.string().optional(),
          })
          .optional(),
        pagination: z
          .object({
            first: z.number().min(1).max(100).default(50),
            after: z.string().optional(),
          })
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);

        // Build filters object without undefined values
        const filters: {
          status?: string[];
          priority?: number[];
          assigneeId?: string;
          projectId?: string;
        } = {};
        if (input.filters?.status) filters.status = input.filters.status;
        if (input.filters?.priority) filters.priority = input.filters.priority;
        if (input.filters?.assigneeId)
          filters.assigneeId = input.filters.assigneeId;
        if (input.filters?.projectId)
          filters.projectId = input.filters.projectId;

        // Build params object to avoid exactOptionalPropertyTypes issues
        const params: {
          status?: string[];
          priority?: number[];
          assigneeId?: string;
          projectId?: string;
          first: number;
          after?: string;
        } = {
          first: input.pagination?.first ?? 50,
        };
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.assigneeId) params.assigneeId = filters.assigneeId;
        if (filters.projectId) params.projectId = filters.projectId;
        if (input.pagination?.after) params.after = input.pagination.after;

        const result = await driver.getIssues(params);

        return {
          success: true,
          issues: result.issues,
          hasNextPage: result.hasNextPage,
          endCursor: result.endCursor,
        };
      } catch (error) {
        console.error('Failed to fetch Linear issues:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch issues from Linear',
        });
      }
    }),

  /**
   * Get a single issue by ID
   */
  getIssue: rateLimitedProtectedProcedure('linear:read')
    .input(z.object({ issueId: z.string() }))
    .query(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);
        const issue = await driver.getIssue(input.issueId);

        if (!issue) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Issue not found',
          });
        }

        return {
          success: true,
          issue,
        };
      } catch (error) {
        console.error('Failed to fetch Linear issue:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch issue from Linear',
        });
      }
    }),

  /**
   * Fetch projects from Linear
   */
  getProjects: rateLimitedProtectedProcedure('linear:read').query(
    async ({ ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);
        const projects = await driver.getProjects();

        return {
          success: true,
          projects,
        };
      } catch (error) {
        console.error('Failed to fetch Linear projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects from Linear',
        });
      }
    }
  ),

  /**
   * Get workflow states (for filter dropdown)
   */
  getWorkflowStates: rateLimitedProtectedProcedure('linear:read').query(
    async ({ ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        return { success: true, states: [] };
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);
        const states = await driver.getWorkflowStates();

        return {
          success: true,
          states,
        };
      } catch (error) {
        console.error('Failed to fetch Linear workflow states:', error);
        return { success: true, states: [] };
      }
    }
  ),

  /**
   * Get teams (for filter dropdown)
   */
  getTeams: rateLimitedProtectedProcedure('linear:read').query(
    async ({ ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        return { success: true, teams: [] };
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);
        const teams = await driver.getTeams();

        return {
          success: true,
          teams,
        };
      } catch (error) {
        console.error('Failed to fetch Linear teams:', error);
        return { success: true, teams: [] };
      }
    }
  ),

  /**
   * Create a bounty from a Linear issue
   * This will be called from the Linear integration UI
   * The actual bounty creation is handled by the bounties router
   * This endpoint validates access and pre-fills data from Linear
   */
  getBountyDataFromIssue: rateLimitedProtectedProcedure('linear:create')
    .input(z.object({ linearIssueId: z.string() }))
    .query(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);
        const issue = await driver.getIssue(input.linearIssueId);

        if (!issue) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Issue not found',
          });
        }

        return {
          success: true,
          data: {
            title: issue.title,
            description: issue.description ?? '',
            linearIssueId: issue.id,
            linearIssueIdentifier: issue.identifier,
            linearIssueUrl: issue.url,
            linearAccountId: linearWorkspace.id,
          },
        };
      } catch (error) {
        console.error('Failed to fetch Linear issue for bounty:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch issue from Linear',
        });
      }
    }),

  /**
   * Post a comment to a Linear issue (called after bounty events)
   */
  postComment: rateLimitedProtectedProcedure('linear:comment')
    .input(
      z.object({
        linearIssueId: z.string(),
        commentType: z.enum([
          'bountyCreated',
          'bountyFunded',
          'submissionReceived',
          'bountyCompleted',
        ]),
        bountyData: z.object({
          title: z.string(),
          amount: z.string(),
          currency: z.string().default('USD'),
          deadline: z.string().optional(),
          bountyUrl: z.string(),
          submitter: z.string().optional(),
          winner: z.string().optional(),
          timestamp: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const driver = createLinearDriver(linearOAuthAccount.accessToken);

        // Generate comment body based on type
        let commentBody: string;
        switch (input.commentType) {
          case 'bountyCreated':
            commentBody = LINEAR_COMMENT_TEMPLATES.bountyCreated(
              input.bountyData.title,
              input.bountyData.amount,
              input.bountyData.currency,
              input.bountyData.bountyUrl
            );
            break;
          case 'bountyFunded':
            commentBody = LINEAR_COMMENT_TEMPLATES.bountyFunded(
              input.bountyData.amount,
              input.bountyData.currency,
              input.bountyData.bountyUrl,
              input.bountyData.deadline
            );
            break;
          case 'submissionReceived':
            commentBody = LINEAR_COMMENT_TEMPLATES.submissionReceived(
              input.bountyData.submitter!,
              input.bountyData.timestamp!,
              input.bountyData.bountyUrl
            );
            break;
          case 'bountyCompleted':
            commentBody = LINEAR_COMMENT_TEMPLATES.bountyCompleted(
              input.bountyData.winner!,
              input.bountyData.timestamp!,
              input.bountyData.bountyUrl
            );
            break;
        }

        const comment = await driver.createComment(
          input.linearIssueId,
          commentBody
        );

        return {
          success: true,
          commentId: comment?.id ?? null,
        };
      } catch (error) {
        console.error('Failed to post comment to Linear:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to post comment to Linear',
        });
      }
    }),

  /**
   * Disconnect Linear workspace
   */
  disconnect: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!linearOAuthAccount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      await ctx.db
        .update(linearAccount)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(linearAccount.linearWorkspaceId, input.workspaceId),
            eq(linearAccount.accountId, linearOAuthAccount.id)
          )
        );

      return { success: true };
    }),

  /**
   * Sync Linear workspace - called after OAuth to create the linear_account record
   * This fetches the workspace info from Linear and stores it in the database
   */
  syncWorkspace: protectedProcedure.mutation(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!(linearOAuthAccount && linearOAuthAccount.accessToken)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          'Linear account not connected. Please link your Linear account first.',
      });
    }

    try {
      const driver = createLinearDriver(linearOAuthAccount.accessToken);

      // Fetch user info and workspace from Linear
      const user = await driver.getCurrentUser();
      const workspace = await driver.getCurrentWorkspace();

      if (!(user && workspace)) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user or workspace info from Linear',
        });
      }

      // Check if a linear_account record already exists for this workspace
      const [existingRecord] = await ctx.db
        .select()
        .from(linearAccount)
        .where(
          and(
            eq(linearAccount.accountId, linearOAuthAccount.id),
            eq(linearAccount.linearWorkspaceId, workspace.id)
          )
        )
        .limit(1);

      if (existingRecord) {
        // Update existing record if it was inactive
        if (!existingRecord.isActive) {
          await ctx.db
            .update(linearAccount)
            .set({
              isActive: true,
              linearWorkspaceName: workspace.name,
              linearWorkspaceUrl: workspace.url,
              linearWorkspaceKey: workspace.key,
              updatedAt: new Date(),
            })
            .where(eq(linearAccount.id, existingRecord.id));
        }
        return {
          success: true,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            key: workspace.key,
            url: workspace.url,
          },
        };
      }

      // Create new linear_account record
      await ctx.db.insert(linearAccount).values({
        accountId: linearOAuthAccount.id,
        linearUserId: user.id,
        linearWorkspaceId: workspace.id,
        linearWorkspaceName: workspace.name,
        linearWorkspaceUrl: workspace.url,
        linearWorkspaceKey: workspace.key,
        isActive: true,
      });

      return {
        success: true,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          key: workspace.key,
          url: workspace.url,
        },
      };
    } catch (error) {
      console.error('Failed to sync Linear workspace:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync Linear workspace',
      });
    }
  }),
});
