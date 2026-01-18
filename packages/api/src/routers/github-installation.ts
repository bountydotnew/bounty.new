import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getGithubAppManager } from '../../driver/github-app';
import { protectedProcedure, router } from '../trpc';
import { githubInstallation } from '@bounty/db/src/schema/github-installation';
import { account } from '@bounty/db';
import { eq, and } from 'drizzle-orm';

export const githubInstallationRouter = router({
  /**
   * Get all GitHub App installations for the current user
   */
  getInstallations: protectedProcedure.query(async ({ ctx }) => {
    // Get the user's GitHub account to find installations
    const [githubAccount] = await ctx.db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.session.user.id),
          eq(account.providerId, 'github')
        )
      )
      .limit(1);

    if (!githubAccount) {
      return { success: true, installations: [] };
    }

    // Get installations linked to this account
    const installations = await ctx.db
      .select()
      .from(githubInstallation)
      .where(eq(githubInstallation.githubAccountId, githubAccount.id));

    return {
      success: true,
      installations: installations.map((inst) => ({
        id: inst.githubInstallationId,
        accountLogin: inst.accountLogin,
        accountType: inst.accountType,
        accountAvatarUrl: inst.accountAvatarUrl,
        repositoryIds: inst.repositoryIds,
        suspendedAt: inst.suspendedAt,
        createdAt: inst.createdAt,
        updatedAt: inst.updatedAt,
      })),
    };
  }),

  /**
   * Get repositories for a specific installation
   */
  getRepositories: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const githubApp = getGithubAppManager();

      try {
        const result = await githubApp.getInstallationRepositories(input.installationId);

        return {
          success: true,
          repositories: result.repositories.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            private: r.private,
            htmlUrl: r.html_url,
            description: r.description,
          })),
        };
      } catch (error) {
        console.error('Failed to get installation repositories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch repositories from GitHub',
        });
      }
    }),

  /**
   * Get installation details
   */
  getInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const githubApp = getGithubAppManager();

      try {
        const installation = await githubApp.getInstallation(input.installationId);

        return {
          success: true,
          installation: {
            id: installation.id,
            account: installation.account,
            suspendedAt: installation.suspended_at,
          },
        };
      } catch (error) {
        console.error('Failed to get installation details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch installation details from GitHub',
        });
      }
    }),

  /**
   * Get the GitHub App installation URL
   */
  getInstallationUrl: protectedProcedure
    .input(
      z.object({
        state: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const githubApp = getGithubAppManager();
      return {
        success: true,
        url: githubApp.getInstallationUrl(input.state),
      };
    }),

  /**
   * Sync installations from GitHub webhook callback
   * This is called after the user installs the app
   */
  syncInstallation: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get the user's GitHub account
      const [githubAccount] = await ctx.db
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, ctx.session.user.id),
            eq(account.providerId, 'github')
          )
        )
        .limit(1);

      if (!githubAccount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'GitHub account not connected',
        });
      }

      const githubApp = getGithubAppManager();

      try {
        // Get installation details from GitHub
        const installation = await githubApp.getInstallation(input.installationId);

        // Get repositories from the installation
        const repos = await githubApp.getInstallationRepositories(input.installationId);

        // Upsert the installation record
        await ctx.db
          .insert(githubInstallation)
          .values({
            githubInstallationId: installation.id,
            githubAccountId: githubAccount.id,
            accountLogin: installation.account.login,
            accountType: installation.account.type,
            accountAvatarUrl: installation.account.avatar_url,
            repositoryIds: repos.repositories.map((r) => String(r.id)),
          })
          .onConflictDoUpdate({
            target: githubInstallation.githubInstallationId,
            set: {
              accountLogin: installation.account.login,
              accountType: installation.account.type,
              accountAvatarUrl: installation.account.avatar_url,
              repositoryIds: repos.repositories.map((r) => String(r.id)),
              updatedAt: new Date(),
            },
          });

        return {
          success: true,
          installation: {
            id: installation.id,
            accountLogin: installation.account.login,
            accountType: installation.account.type,
            repositoryCount: repos.repositories.length,
          },
        };
      } catch (error) {
        console.error('Failed to sync installation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync GitHub installation',
        });
      }
    }),

  /**
   * Remove an installation (delete from our database)
   * Note: The GitHub App webhook handles this automatically
   */
  removeInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(githubInstallation)
        .where(eq(githubInstallation.githubInstallationId, input.installationId));

      return { success: true };
    }),
});
