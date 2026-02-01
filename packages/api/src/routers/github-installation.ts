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
        isDefault: inst.isDefault,
        createdAt: inst.createdAt,
        updatedAt: inst.updatedAt,
      })),
    };
  }),

  /**
   * Sync all installations from GitHub for the current user
   * This allows users to manually sync their GitHub App installations
   */
  syncAllInstallations: protectedProcedure.mutation(async ({ ctx }) => {
    // Get the user's GitHub account with access token
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

    if (!githubAccount.accessToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'GitHub access token not available',
      });
    }

    const githubApp = getGithubAppManager();

    // Create Octokit instance with the user's access token
    const OctokitWithRest = Octokit.plugin(restEndpointMethods);
    const octokit = new OctokitWithRest({ auth: githubAccount.accessToken });

    try {
      // Get all installations for the authenticated user
      const { data } = await octokit.rest.apps.listInstallationsForAuthenticatedUser();

      const installations: Array<{
        id: number;
        accountLogin: string;
        accountType: string;
        accountAvatarUrl: string;
        repositoryCount: number;
      }> = [];

      // Sync each installation
      for (const installation of data.installations) {
        try {
          // Get installation details
          const installationDetails = await githubApp.getInstallation(installation.id);

          // Get repositories from the installation
          const repos = await githubApp.getInstallationRepositories(installation.id);

          // Upsert the installation record
          await ctx.db
            .insert(githubInstallation)
            .values({
              githubInstallationId: installation.id,
              githubAccountId: githubAccount.id,
              accountLogin: installationDetails.account.login,
              accountType: installationDetails.account.type,
              accountAvatarUrl: installationDetails.account.avatar_url,
              repositoryIds: repos.repositories.map((r) => String(r.id)),
            })
            .onConflictDoUpdate({
              target: githubInstallation.githubInstallationId,
              set: {
                accountLogin: installationDetails.account.login,
                accountType: installationDetails.account.type,
                accountAvatarUrl: installationDetails.account.avatar_url,
                repositoryIds: repos.repositories.map((r) => String(r.id)),
                updatedAt: new Date(),
              },
            });

          installations.push({
            id: installation.id,
            accountLogin: installationDetails.account.login,
            accountType: installationDetails.account.type,
            accountAvatarUrl: installationDetails.account.avatar_url,
            repositoryCount: repos.repositories.length,
          });
        } catch (error) {
          console.error(`Failed to sync installation ${installation.id}:`, error);
          // Continue with other installations even if one fails
        }
      }

      return {
        success: true,
        syncedCount: installations.length,
        installations,
      };
    } catch (error) {
      console.error('Failed to sync installations:', error);
      // Check for specific error about unauthorized access
      const message = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '';
      if (message.includes('authenticate with an access token authorized to a GitHub App')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Your GitHub account does not have access to any Bounty App installations. Please install the app first.',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync GitHub installations',
      });
    }
  }),

  /**
   * Get repositories for a specific installation
   */
  getRepositories: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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

  /**
   * Set an installation as the default for the current user
   */
  setDefaultInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
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

      // Verify the installation belongs to this user
      const [installation] = await ctx.db
        .select()
        .from(githubInstallation)
        .where(
          and(
            eq(githubInstallation.githubInstallationId, input.installationId),
            eq(githubInstallation.githubAccountId, githubAccount.id)
          )
        )
        .limit(1);

      if (!installation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installation not found',
        });
      }

      // Unset all other defaults for this user
      await ctx.db
        .update(githubInstallation)
        .set({ isDefault: false })
        .where(
          and(
            eq(githubInstallation.githubAccountId, githubAccount.id),
            eq(githubInstallation.isDefault, true)
          )
        );

      // Set this installation as default
      await ctx.db
        .update(githubInstallation)
        .set({ isDefault: true })
        .where(eq(githubInstallation.id, installation.id));

      return { success: true };
    }),

  /**
   * Get the default installation for the current user
   */
  getDefaultInstallation: protectedProcedure.query(async ({ ctx }) => {
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
      return null;
    }

    // Get the default installation
    const [installation] = await ctx.db
      .select()
      .from(githubInstallation)
      .where(
        and(
          eq(githubInstallation.githubAccountId, githubAccount.id),
          eq(githubInstallation.isDefault, true)
        )
      )
      .limit(1);

    if (!installation) {
      return null;
    }

    return {
      id: installation.githubInstallationId,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      accountAvatarUrl: installation.accountAvatarUrl,
      isDefault: installation.isDefault,
    };
  }),
});
