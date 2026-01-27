/**
 * Better Auth Server Configuration
 *
 * Centralized authentication setup for the Bounty platform.
 * Handles email/password, GitHub OAuth, Polar payments, device auth, and multi-session support.
 */

import {
  account,
  betaApplication,
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  db,
  deviceCode,
  invite,
  notification,
  session,
  submission,
  user as userTable,
  userProfile,
  userRating,
  userReputation,
  verification,
  waitlist,
} from '@bounty/db';
import { eq } from 'drizzle-orm';
import { env } from '@bounty/env/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  bearer,
  deviceAuthorization,
  openAPI,
  multiSession,
} from 'better-auth/plugins';
import { admin } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import {
  AUTH_CONFIG,
  parseAllowedDeviceClientIds,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendOTPEmail,
} from './config';

// ============================================================================
// Constants & Setup
// ============================================================================

const GitHubOctokit = Octokit.plugin(restEndpointMethods);

const schema = {
  account,
  betaApplication,
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  deviceCode,
  invite,
  notification,
  session,
  submission,
  user: userTable,
  userProfile,
  userRating,
  userReputation,
  verification,
  waitlist,
};

// ============================================================================
// GitHub Integration
// ============================================================================

interface GitHubSyncParams {
  userId: string;
  accessToken: string;
}

/**
 * Sync GitHub username as user handle.
 * Only updates if handle is not already set.
 */
async function syncGitHubHandle({
  userId,
  accessToken,
}: GitHubSyncParams): Promise<void> {
  if (!(userId && accessToken)) {
    return;
  }

  try {
    const octokit = new GitHubOctokit({ auth: accessToken });
    const { data } = await octokit.rest.users.getAuthenticated();

    const githubHandle = data?.login?.toLowerCase();
      if (!githubHandle) {
        return;
      }

    // Check if user already has a handle OR the same handle (avoid unnecessary updates)
    const existingUser = await db.query.user.findFirst({
      where: (fields, { eq }) => eq(fields.id, userId),
      columns: { id: true, handle: true },
    });

    if (existingUser?.handle) {
      return;
    }

    // Update with GitHub handle
    await db
      .update(userTable)
      .set({ handle: githubHandle, updatedAt: new Date() })
      .where(eq(userTable.id, userId));

    console.log(`✅ Synced GitHub handle for user ${userId}: ${githubHandle}`);
  } catch {
    // Silently fail - don't block account creation/update
  }
}

/**
 * Unified handler for GitHub account linking (create and update)
 */
function handleGitHubAccountLinking() {
  return async (account: {
    providerId: string;
    userId: string;
    accessToken?: string | null | undefined;
  }) => {
    if (
      account.providerId === 'github' &&
      account.userId &&
      account.accessToken
    ) {
      await syncGitHubHandle({
        userId: account.userId,
        accessToken: account.accessToken,
      });
    }
  };
}

// ============================================================================
// Better Auth Instance
// ============================================================================

export const auth = betterAuth({
  baseURL: AUTH_CONFIG.baseURL,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'discord'],
      allowDifferentEmails: true,
    },
  },

  session: AUTH_CONFIG.session,

  databaseHooks: {
    account: {
      create: {
        after: handleGitHubAccountLinking(),
      },
      update: {
        after: handleGitHubAccountLinking(),
      },
    },
  },

  onAPIError: {
    throw: true,
    onError: (err) => {
      console.error('Better Auth API Error:', err);
    },
    errorURL: '/auth/error',
  },

  trustedOrigins: [
    'https://bounty.new',
    'https://*.bounty.new', // Matches www.bounty.new, local.bounty.new, preview.bounty.new, etc.
    ...(env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://192.168.1.147:3000',
          'http://100.*.*.*:3000',
          'http://172.*.*.*:3000',
          'https://isiah-unsonant-linn.ngrok-free.dev',
        ]),
  ],

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      scope: ['read:user', 'repo', 'read:org'],
      mapProfileToUser: (profile) => ({
        handle: profile.login?.toLowerCase(),
      }),
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID || '',
      clientSecret: env.DISCORD_CLIENT_SECRET || '',
      scope: ['identify', 'email', 'guilds'],
    },
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: sendPasswordResetEmail,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: sendEmailVerificationEmail,
  },

  plugins: [
    // ========================================================================
    // Core Plugins
    // ========================================================================
    admin(),
    bearer(),
    openAPI(),

    // ========================================================================
    // Email OTP (for passwordless sign-in)
    // ========================================================================
    emailOTP({
      sendVerificationOTP: sendOTPEmail,
    }),

    // ========================================================================
    // Device Authorization (for CLI/mobile apps)
    // ========================================================================
    deviceAuthorization({
      ...AUTH_CONFIG.deviceAuthorization,
      validateClient: (clientId) => {
        const allowedIds = parseAllowedDeviceClientIds();
        return allowedIds.length === 0 || allowedIds.includes(clientId);
      },
    }),

    // ========================================================================
    // Multi-Session Support
    // ========================================================================
    multiSession({
      ...AUTH_CONFIG.multiSession,
    }),
  ],
});

// ============================================================================
// Type Exports
// ============================================================================

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
