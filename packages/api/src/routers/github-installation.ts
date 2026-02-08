import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getGithubAppManager } from '../../driver/github-app';
import {
  protectedProcedure,
  orgProcedure,
  orgOwnerProcedure,
  router,
} from '../trpc';
import { githubInstallation } from '@bounty/db/src/schema/github-installation';
import { account } from '@bounty/db';
import { eq, and } from 'drizzle-orm';

export const githubInstallationRouter = router({
  /**
   * Get all GitHub App installations for the active organization.
   * Falls back to user-scoped lookup if no installations found for the org
   * (backward compat during migration).
   */
  getInstallations: orgProcedure.query(async ({ ctx }) => {
    // Get installations scoped to the active organization
    const installations = await ctx.db
      .select()
      .from(githubInstallation)
      .where(eq(githubInstallation.organizationId, ctx.org.id));

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
   * Get repositories for a specific installation.
   * Verifies the installation belongs to the active org.
   */
  getRepositories: orgProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verify the installation belongs to this org
      const [inst] = await ctx.db
        .select({ id: githubInstallation.id })
        .from(githubInstallation)
        .where(
          and(
            eq(githubInstallation.githubInstallationId, input.installationId),
            eq(githubInstallation.organizationId, ctx.org.id)
          )
        )
        .limit(1);

      if (!inst) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installation not found for this team',
        });
      }

      const githubApp = getGithubAppManager();

      try {
        const result = await githubApp.getInstallationRepositories(
          input.installationId
        );

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
   * Get installation details.
   * Verifies the installation belongs to the active org.
   */
  getInstallation: orgProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verify the installation belongs to this org
      const [inst] = await ctx.db
        .select({ id: githubInstallation.id })
        .from(githubInstallation)
        .where(
          and(
            eq(githubInstallation.githubInstallationId, input.installationId),
            eq(githubInstallation.organizationId, ctx.org.id)
          )
        )
        .limit(1);

      if (!inst) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installation not found for this team',
        });
      }

      const githubApp = getGithubAppManager();

      try {
        const installation = await githubApp.getInstallation(
          input.installationId
        );

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
   * This is called after the user installs the app — scoped to active org
   */
  syncInstallation: orgProcedure
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
        const installation = await githubApp.getInstallation(
          input.installationId
        );

        // Get repositories from the installation
        const repos = await githubApp.getInstallationRepositories(
          input.installationId
        );

        // Upsert the installation record — scoped to active org
        await ctx.db
          .insert(githubInstallation)
          .values({
            githubInstallationId: installation.id,
            githubAccountId: githubAccount.id,
            accountLogin: installation.account.login,
            accountType: installation.account.type,
            accountAvatarUrl: installation.account.avatar_url,
            repositoryIds: repos.repositories.map((r) => String(r.id)),
            organizationId: ctx.org.id,
          })
          .onConflictDoUpdate({
            target: githubInstallation.githubInstallationId,
            set: {
              accountLogin: installation.account.login,
              accountType: installation.account.type,
              accountAvatarUrl: installation.account.avatar_url,
              repositoryIds: repos.repositories.map((r) => String(r.id)),
              organizationId: ctx.org.id,
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
   * Only org owners can remove installations.
   */
  removeInstallation: orgOwnerProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(githubInstallation)
        .where(
          and(
            eq(githubInstallation.githubInstallationId, input.installationId),
            eq(githubInstallation.organizationId, ctx.org.id)
          )
        );

      return { success: true };
    }),

  /**
   * Set an installation as the default for the active organization.
   * Only org owners can change the default installation.
   */
  setDefaultInstallation: orgOwnerProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify the installation belongs to this org
      const [installation] = await ctx.db
        .select()
        .from(githubInstallation)
        .where(
          and(
            eq(githubInstallation.githubInstallationId, input.installationId),
            eq(githubInstallation.organizationId, ctx.org.id)
          )
        )
        .limit(1);

      if (!installation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Installation not found for this team',
        });
      }

      // Atomically unset all defaults and set the new one
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(githubInstallation)
          .set({ isDefault: false })
          .where(
            and(
              eq(githubInstallation.organizationId, ctx.org.id),
              eq(githubInstallation.isDefault, true)
            )
          );

        await tx
          .update(githubInstallation)
          .set({ isDefault: true })
          .where(eq(githubInstallation.id, installation.id));
      });

      return { success: true };
    }),

  /**
   * Get the default installation for the active organization
   */
  getDefaultInstallation: orgProcedure.query(async ({ ctx }) => {
    // Get the default installation for this org
    const [installation] = await ctx.db
      .select()
      .from(githubInstallation)
      .where(
        and(
          eq(githubInstallation.organizationId, ctx.org.id),
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
