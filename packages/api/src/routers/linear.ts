import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  protectedProcedure,
  orgProcedure,
  orgOwnerProcedure,
  router,
  rateLimitedOrgProcedure,
} from '../trpc';
import { linearAccount, account, type db as database } from '@bounty/db';
import { eq, and } from 'drizzle-orm';
import {
  createLinearDriver,
  LINEAR_COMMENT_TEMPLATES,
} from '../../driver/linear-client';
import { env } from '@bounty/env/server';

type Database = typeof database;

interface LinearOAuthAccount {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
}

/**
 * Helper function to get the user's Linear OAuth account
 */
async function getLinearAccount(db: Database, userId: string) {
  const [linearOAuthAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'linear')))
    .limit(1);

  return linearOAuthAccount;
}

/**
 * Helper function to get the Linear workspace connection for a user.
 * When orgId is provided, filters to workspaces belonging to that org.
 */
async function getLinearWorkspace(
  db: Database,
  oauthAccountId: string,
  orgId?: string
) {
  const conditions = [
    eq(linearAccount.accountId, oauthAccountId),
    eq(linearAccount.isActive, true),
  ];

  if (orgId) {
    conditions.push(eq(linearAccount.organizationId, orgId));
  }

  const [workspace] = await db
    .select()
    .from(linearAccount)
    .where(and(...conditions))
    .limit(1);

  return workspace;
}

/**
 * Refresh Linear OAuth access token using the refresh token
 * Returns the new access token or throws an error if refresh fails
 */
async function refreshLinearToken(
  db: Database,
  linearOAuthAccount: LinearOAuthAccount
): Promise<string> {
  if (!linearOAuthAccount.refreshToken) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'No refresh token available. Please reconnect your Linear account.',
    });
  }

  console.log('[Linear] Refreshing access token...');

  try {
    const response = await fetch('https://api.linear.app/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: linearOAuthAccount.refreshToken,
        client_id: env.LINEAR_CLIENT_ID ?? '',
        client_secret: env.LINEAR_CLIENT_SECRET ?? '',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Linear] Token refresh failed:', errorText);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message:
          'Failed to refresh Linear token. Please reconnect your Linear account.',
      });
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update the account with new tokens
    await db
      .update(account)
      .set({
        accessToken: tokenData.access_token,
        refreshToken:
          tokenData.refresh_token ?? linearOAuthAccount.refreshToken,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(account.id, linearOAuthAccount.id));

    console.log(
      '[Linear] Token refreshed successfully, expires at:',
      expiresAt
    );
    return tokenData.access_token;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error('[Linear] Error refreshing token:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to refresh Linear token',
    });
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(
  db: Database,
  linearOAuthAccount: LinearOAuthAccount
): Promise<string> {
  if (!linearOAuthAccount.accessToken) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'No access token available. Please reconnect your Linear account.',
    });
  }

  // Check if token is expired or will expire in the next 5 minutes
  const expiresAt = linearOAuthAccount.accessTokenExpiresAt;
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const isExpired =
    expiresAt && new Date(expiresAt).getTime() < Date.now() + bufferTime;

  if (isExpired) {
    console.log(
      '[Linear] Access token expired or expiring soon, refreshing...'
    );
    return await refreshLinearToken(db, linearOAuthAccount);
  }

  return linearOAuthAccount.accessToken;
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
   * Get all Linear workspaces for the current user (scoped to active org)
   */
  getWorkspaces: orgProcedure.query(async ({ ctx }) => {
    // Get the user's Linear OAuth account
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount?.accessToken) {
      return { success: true, workspaces: [] };
    }

    // Get the Linear workspace connection scoped to the active org
    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id,
      ctx.org.id
    );

    if (!linearWorkspace) {
      return { success: true, workspaces: [] };
    }

    try {
      const accessToken = await getValidAccessToken(ctx.db, linearOAuthAccount);
      const driver = createLinearDriver(accessToken);
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
   * Get connection status (whether user has connected Linear for the active org)
   */
  getConnectionStatus: orgProcedure.query(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount) {
      return { success: true, connected: false, workspace: null };
    }

    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id,
      ctx.org.id
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
  getIssues: rateLimitedOrgProcedure('linear:read')
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

      if (!linearOAuthAccount?.accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id,
        ctx.org.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        // Get a valid access token, refreshing if necessary
        const accessToken = await getValidAccessToken(
          ctx.db,
          linearOAuthAccount
        );
        const driver = createLinearDriver(accessToken);

        // Build filters object without undefined values
        const filters: {
          status?: string[];
          priority?: number[];
          assigneeId?: string;
          projectId?: string;
        } = {};
        if (input.filters?.status) {
          filters.status = input.filters.status;
        }
        if (input.filters?.priority) {
          filters.priority = input.filters.priority;
        }
        if (input.filters?.assigneeId) {
          filters.assigneeId = input.filters.assigneeId;
        }
        if (input.filters?.projectId) {
          filters.projectId = input.filters.projectId;
        }

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
        if (filters.status) {
          params.status = filters.status;
        }
        if (filters.priority) {
          params.priority = filters.priority;
        }
        if (filters.assigneeId) {
          params.assigneeId = filters.assigneeId;
        }
        if (filters.projectId) {
          params.projectId = filters.projectId;
        }
        if (input.pagination?.after) {
          params.after = input.pagination.after;
        }

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
  getIssue: rateLimitedOrgProcedure('linear:read')
    .input(z.object({ issueId: z.string() }))
    .query(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!linearOAuthAccount?.accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id,
        ctx.org.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const accessToken = await getValidAccessToken(
          ctx.db,
          linearOAuthAccount
        );
        const driver = createLinearDriver(accessToken);
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
  getProjects: rateLimitedOrgProcedure('linear:read').query(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount?.accessToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Linear account not connected',
      });
    }

    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id,
      ctx.org.id
    );

    if (!linearWorkspace) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Linear workspace not connected',
      });
    }

    try {
      // Get a valid access token, refreshing if necessary
      const accessToken = await getValidAccessToken(ctx.db, linearOAuthAccount);
      const driver = createLinearDriver(accessToken);
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
  }),

  /**
   * Get workflow states (for filter dropdown)
   */
  getWorkflowStates: rateLimitedOrgProcedure('linear:read').query(
    async ({ ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!linearOAuthAccount?.accessToken) {
        return { success: true, states: [] };
      }

      // Check for active workspace connection scoped to active org
      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id,
        ctx.org.id
      );
      if (!linearWorkspace) {
        return { success: true, states: [] };
      }

      try {
        const accessToken = await getValidAccessToken(
          ctx.db,
          linearOAuthAccount
        );
        const driver = createLinearDriver(accessToken);
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
  getTeams: rateLimitedOrgProcedure('linear:read').query(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount?.accessToken) {
      return { success: true, teams: [] };
    }

    // Check for active workspace connection scoped to active org
    const linearWorkspace = await getLinearWorkspace(
      ctx.db,
      linearOAuthAccount.id,
      ctx.org.id
    );
    if (!linearWorkspace) {
      return { success: true, teams: [] };
    }

    try {
      const accessToken = await getValidAccessToken(ctx.db, linearOAuthAccount);
      const driver = createLinearDriver(accessToken);
      const teams = await driver.getTeams();

      return {
        success: true,
        teams,
      };
    } catch (error) {
      console.error('Failed to fetch Linear teams:', error);
      return { success: true, teams: [] };
    }
  }),

  /**
   * Create a bounty from a Linear issue
   * This will be called from the Linear integration UI
   * The actual bounty creation is handled by the bounties router
   * This endpoint validates access and pre-fills data from Linear
   */
  getBountyDataFromIssue: rateLimitedOrgProcedure('linear:create')
    .input(z.object({ linearIssueId: z.string() }))
    .query(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!linearOAuthAccount?.accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id,
        ctx.org.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const accessToken = await getValidAccessToken(
          ctx.db,
          linearOAuthAccount
        );
        const driver = createLinearDriver(accessToken);
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
  postComment: rateLimitedOrgProcedure('linear:comment')
    .input(
      z.discriminatedUnion('commentType', [
        z.object({
          linearIssueId: z.string(),
          commentType: z.literal('bountyCreated'),
          bountyData: z.object({
            title: z.string(),
            amount: z.string(),
            currency: z.string().default('USD'),
            bountyUrl: z.string(),
          }),
        }),
        z.object({
          linearIssueId: z.string(),
          commentType: z.literal('bountyFunded'),
          bountyData: z.object({
            amount: z.string(),
            currency: z.string().default('USD'),
            bountyUrl: z.string(),
            deadline: z.string().optional(),
          }),
        }),
        z.object({
          linearIssueId: z.string(),
          commentType: z.literal('submissionReceived'),
          bountyData: z.object({
            bountyUrl: z.string(),
            submitter: z.string(),
            timestamp: z.string(),
          }),
        }),
        z.object({
          linearIssueId: z.string(),
          commentType: z.literal('bountyCompleted'),
          bountyData: z.object({
            bountyUrl: z.string(),
            winner: z.string(),
            timestamp: z.string(),
          }),
        }),
      ])
    )
    .mutation(async ({ input, ctx }) => {
      const linearOAuthAccount = await getLinearAccount(
        ctx.db,
        ctx.session.user.id
      );

      if (!linearOAuthAccount?.accessToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear account not connected',
        });
      }

      const linearWorkspace = await getLinearWorkspace(
        ctx.db,
        linearOAuthAccount.id,
        ctx.org.id
      );

      if (!linearWorkspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Linear workspace not connected',
        });
      }

      try {
        const accessToken = await getValidAccessToken(
          ctx.db,
          linearOAuthAccount
        );
        const driver = createLinearDriver(accessToken);

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
              input.bountyData.submitter,
              input.bountyData.timestamp,
              input.bountyData.bountyUrl
            );
            break;
          case 'bountyCompleted':
            commentBody = LINEAR_COMMENT_TEMPLATES.bountyCompleted(
              input.bountyData.winner,
              input.bountyData.timestamp,
              input.bountyData.bountyUrl
            );
            break;
          default: {
            // Exhaustive check - TypeScript will error if a case is missing
            const _exhaustiveCheck: never = input;
            throw new Error(`Unhandled comment type: ${_exhaustiveCheck}`);
          }
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
   * Deletes both the linear_account record and the OAuth account record
   */
  disconnect: orgOwnerProcedure
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

      // Verify the workspace belongs to the active org before disconnecting
      const [workspace] = await ctx.db
        .select({ id: linearAccount.id })
        .from(linearAccount)
        .where(
          and(
            eq(linearAccount.linearWorkspaceId, input.workspaceId),
            eq(linearAccount.accountId, linearOAuthAccount.id),
            eq(linearAccount.organizationId, ctx.org.id)
          )
        )
        .limit(1);

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Linear workspace not found for this team',
        });
      }

      // Delete the linear_account record
      await ctx.db
        .delete(linearAccount)
        .where(
          and(
            eq(linearAccount.linearWorkspaceId, input.workspaceId),
            eq(linearAccount.accountId, linearOAuthAccount.id),
            eq(linearAccount.organizationId, ctx.org.id)
          )
        );

      // Delete the OAuth account record (removes access/refresh tokens)
      await ctx.db.delete(account).where(eq(account.id, linearOAuthAccount.id));

      return { success: true };
    }),

  /**
   * Sync Linear workspace - called after OAuth to create the linear_account record
   * This fetches the workspace info from Linear and stores it in the database
   */
  syncWorkspace: orgProcedure.mutation(async ({ ctx }) => {
    const linearOAuthAccount = await getLinearAccount(
      ctx.db,
      ctx.session.user.id
    );

    if (!linearOAuthAccount?.accessToken) {
      // Return early without throwing - this can happen if the user disconnected
      // before the sync effect ran (race condition after OAuth callback)
      return {
        success: false,
        workspace: null,
      };
    }

    try {
      // For sync, we need to use the token as-is since it was just obtained during OAuth
      // The token should be fresh at this point
      const accessToken = linearOAuthAccount.accessToken;
      const driver = createLinearDriver(accessToken);

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

      // Create new linear_account record — scoped to active org
      await ctx.db.insert(linearAccount).values({
        accountId: linearOAuthAccount.id,
        linearUserId: user.id,
        linearWorkspaceId: workspace.id,
        linearWorkspaceName: workspace.name,
        linearWorkspaceUrl: workspace.url,
        linearWorkspaceKey: workspace.key,
        isActive: true,
        organizationId: ctx.org.id,
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
