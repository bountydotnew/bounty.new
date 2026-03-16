/**
 * GitHub App Installation functions.
 *
 * Replaces: packages/api/src/routers/github-installation.ts (8 procedures)
 *
 * Manages GitHub App installations linked to organizations.
 */
import { query, mutation, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import {
  requireAuth,
  getAuthenticatedUser,
  requireOrgMember,
  requireOrgOwner,
} from '../lib/auth';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all GitHub installations for the current org.
 * Replaces: githubInstallation.getInstallations (orgProcedure query)
 */
export const getInstallations = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];
    let result;
    try {
      result = await requireOrgMember(ctx, args.organizationId as any);
    } catch {
      return [];
    }

    const installations = await ctx.db
      .query('githubInstallations')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    return installations;
  },
});

/**
 * Get the default GitHub installation for the current org.
 * Replaces: githubInstallation.getDefaultInstallation (orgProcedure query)
 */
export const getDefaultInstallation = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgMember(ctx, args.organizationId as any);

    const installation = await ctx.db
      .query('githubInstallations')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();

    return installation;
  },
});

/**
 * Get the GitHub App installation URL.
 * Replaces: githubInstallation.getInstallationUrl (protectedProcedure query)
 */
export const getInstallationUrl = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return { url: null };

    const appId = process.env.GITHUB_APP_ID;
    if (!appId) return { url: null };

    let url = 'https://github.com/apps/bounty-new/installations/new';
    if (args.state) {
      url += `?state=${encodeURIComponent(args.state)}`;
    }

    return { url };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set a GitHub installation as the default for the org.
 * Replaces: githubInstallation.setDefaultInstallation (orgOwnerProcedure mutation)
 *
 * In PostgreSQL this was a transaction (unset all, then set one).
 * In Convex, every mutation is already a transaction.
 */
export const setDefaultInstallation = mutation({
  args: {
    organizationId: v.optional(v.id('organizations')),
    installationId: v.float64(),
  },
  handler: async (ctx, args) => {
    const result = await requireOrgOwner(ctx, args.organizationId as any);

    // Unset all defaults for this org
    const installations = await ctx.db
      .query('githubInstallations')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    for (const inst of installations) {
      if (inst.isDefault) {
        await ctx.db.patch(inst._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Set the target as default
    const target = installations.find(
      (i) => i.githubInstallationId === args.installationId
    );
    if (!target) throw new ConvexError('INSTALLATION_NOT_FOUND');

    await ctx.db.patch(target._id, { isDefault: true, updatedAt: Date.now() });
  },
});

// ============================================================================
// ACTIONS (call GitHub API)
// ============================================================================

/**
 * Get repositories accessible to a GitHub installation.
 * Replaces: githubInstallation.getRepositories (orgProcedure query → action)
 */
export const getRepositories = action({
  args: {
    organizationId: v.optional(v.string()),
    installationId: v.float64(),
  },
  handler: async (ctx, args) => {
    // Verify org membership would happen via a query
    // For now, call GitHub directly
    const { Octokit } = await import('@octokit/core');
    const { createAppAuth } = await import('@octokit/auth-app');
    const { restEndpointMethods } = await import(
      '@octokit/plugin-rest-endpoint-methods'
    );

    const OctokitWithRest = Octokit.plugin(restEndpointMethods);

    const octokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
        installationId: args.installationId,
      },
    });

    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    return data.repositories.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      url: r.html_url,
    }));
  },
});

/**
 * Get installation details from GitHub.
 * Replaces: githubInstallation.getInstallation (orgProcedure query → action)
 */
export const getInstallation = action({
  args: { installationId: v.float64() },
  handler: async (ctx, args) => {
    const { Octokit } = await import('@octokit/core');
    const { createAppAuth } = await import('@octokit/auth-app');
    const { restEndpointMethods } = await import(
      '@octokit/plugin-rest-endpoint-methods'
    );

    const OctokitWithRest = Octokit.plugin(restEndpointMethods);
    const octokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
      },
    });

    const { data } = await octokit.rest.apps.getInstallation({
      installation_id: args.installationId,
    });

    const account = data.account;
    const isUserAccount = account && 'login' in account;

    return {
      id: data.id,
      accountLogin: isUserAccount ? account.login : account?.name,
      accountType: isUserAccount ? account.type : 'Organization',
      accountAvatarUrl: account?.avatar_url,
    };
  },
});

/**
 * Sync a GitHub installation from GitHub to Convex.
 * Replaces: githubInstallation.syncInstallation (orgProcedure mutation → action)
 */
export const syncInstallation = action({
  args: {
    organizationId: v.optional(v.string()),
    installationId: v.float64(),
  },
  handler: async (ctx, args) => {
    // Get installation data from GitHub
    const installationData = await ctx.runAction(
      internal.functions.githubInstallation.getInstallation,
      { installationId: args.installationId }
    );

    // Get repositories
    const repos = await ctx.runAction(
      internal.functions.githubInstallation.getRepositories,
      {
        installationId: args.installationId,
        organizationId: args.organizationId,
      }
    );

    // Upsert via mutation
    await ctx.runMutation(
      internal.functions.githubInstallation.upsertInstallation,
      {
        githubInstallationId: args.installationId,
        accountLogin: installationData.accountLogin,
        accountType: installationData.accountType,
        accountAvatarUrl: installationData.accountAvatarUrl,
        repositoryIds: repos.map((r: any) => String(r.id)),
      }
    );
  },
});

/**
 * Remove a GitHub installation.
 * Replaces: githubInstallation.removeInstallation (orgOwnerProcedure mutation → action)
 */
export const removeInstallation = action({
  args: {
    organizationId: v.optional(v.string()),
    installationId: v.float64(),
  },
  handler: async (ctx, args) => {
    // Delete from GitHub
    try {
      const { Octokit } = await import('@octokit/core');
      const { createAppAuth } = await import('@octokit/auth-app');
      const { restEndpointMethods } = await import(
        '@octokit/plugin-rest-endpoint-methods'
      );

      const OctokitWithRest = Octokit.plugin(restEndpointMethods);
      const octokit = new OctokitWithRest({
        authStrategy: createAppAuth,
        auth: {
          appId: process.env.GITHUB_APP_ID!,
          privateKey: Buffer.from(
            process.env.GITHUB_APP_PRIVATE_KEY!,
            'base64'
          ).toString('utf-8'),
        },
      });

      await octokit.rest.apps.deleteInstallation({
        installation_id: args.installationId,
      });
    } catch (e) {
      console.error('[GitHub] Failed to delete installation from GitHub:', e);
    }

    // Delete from Convex
    await ctx.runMutation(
      internal.functions.githubInstallation.deleteInstallationRecord,
      { githubInstallationId: args.installationId }
    );
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

export const upsertInstallation = mutation({
  args: {
    githubInstallationId: v.float64(),
    accountLogin: v.optional(v.string()),
    accountType: v.optional(v.string()),
    accountAvatarUrl: v.optional(v.string()),
    repositoryIds: v.optional(v.array(v.string())),
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
      await ctx.db.patch(existing._id, {
        accountLogin: args.accountLogin,
        accountType: args.accountType,
        accountAvatarUrl: args.accountAvatarUrl,
        repositoryIds: args.repositoryIds,
        updatedAt: now,
      });
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

export const deleteInstallationRecord = mutation({
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
