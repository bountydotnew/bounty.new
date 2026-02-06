/**
 * Better Auth Server Configuration
 *
 * Centralized authentication setup for the Bounty platform.
 * Handles email/password, GitHub OAuth, device auth, multi-session,
 * and organization-first experience.
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
  member,
  notification,
  organization as organizationTable,
  orgInvitation,
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
  organization,
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
  member,
  notification,
  organization: organizationTable,
  invitation: orgInvitation,
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

    console.log(`Synced GitHub handle for user ${userId}: ${githubHandle}`);
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
// Organization Helpers
// ============================================================================

/**
 * Generate a slug from user email for default "Personal" org.
 */
function generateOrgSlug(email: string): string {
  const raw = email.split('@')[0] || '';
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'bounty'}-${suffix}`;
}

/**
 * Check if a user is on the waitlist only (not yet granted early access).
 * Waitlist users have role='user' and exist in the waitlist table.
 * Users with role='early_access' or 'admin' have been granted full access.
 */
async function isWaitlistOnlyUser(userId: string): Promise<boolean> {
  const existingUser = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.id, userId),
    columns: { role: true },
  });

  // If user has early_access or admin role, they're not waitlist-only
  if (existingUser?.role === 'early_access' || existingUser?.role === 'admin') {
    return false;
  }

  return true;
}

/**
 * Get the active organization for a user when creating a session.
 * Returns the most recently joined org or the first one found.
 */
async function getActiveOrganizationId(
  userId: string
): Promise<string | undefined> {
  try {
    const membership = await db.query.member.findFirst({
      where: (fields, { eq }) => eq(fields.userId, userId),
      columns: { organizationId: true },
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    });

    return membership?.organizationId;
  } catch (error) {
    console.error('Error getting active organization ID:', error);
    return undefined;
  }
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
      trustedProviders: ['github', 'google', 'discord', 'linear'],
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
    user: {
      create: {
        after: async (user) => {
          // Auto-create a "Personal" organization for every new user.
          // This establishes the org-first experience from day one.
          try {
            const slug = generateOrgSlug(user.email);

            await auth.api.createOrganization({
              body: {
                name: 'Personal',
                slug,
                userId: user.id,
              },
            });

            console.log(
              `Created Personal org for user ${user.id}: ${slug}`
            );
          } catch (error) {
            console.error(
              `Failed to create Personal org for user ${user.id}:`,
              error
            );
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Auto-set the active organization when a session is created.
          const activeOrgId = await getActiveOrganizationId(session.userId);

          return {
            data: {
              ...session,
              ...(activeOrgId ? { activeOrganizationId: activeOrgId } : {}),
            },
          };
        },
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
      scope: ['read:user', 'public_repo', 'read:org'],
      mapProfileToUser: (profile) => ({
        handle: profile.login?.toLowerCase(),
      }),
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      scope: ['openid', 'email', 'profile'],
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID || '',
      clientSecret: env.DISCORD_CLIENT_SECRET || '',
      scope: ['identify', 'email', 'guilds'],
    },
    linear: {
      clientId: env.LINEAR_CLIENT_ID || '',
      clientSecret: env.LINEAR_CLIENT_SECRET || '',
      scope: ['read', 'write'],
      redirectURI: env.LINEAR_REDIRECT_URI,
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

    // ========================================================================
    // Organization Plugin (org-first experience)
    // ========================================================================
    organization({
      // The creator of an org is the owner
      creatorRole: 'owner',
      // Every user can create organizations
      allowUserToCreateOrganization: true,
      // Send invitation emails for org invites
      async sendInvitationEmail(data) {
        // TODO: Implement org invitation email template
        console.log(
          `Organization invitation for ${data.email} to ${data.organization.name} (${data.id})`
        );
      },
    }),
  ],
});

// ============================================================================
// Type Exports
// ============================================================================

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
