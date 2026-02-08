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
  invitation,
  invite,
  member,
  notification,
  organization,
  session,
  submission,
  user as userTable,
  userProfile,
  userRating,
  userReputation,
  verification,
  waitlist,
} from '@bounty/db';
import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import { env } from '@bounty/env/server';
import { sendEmail, FROM_ADDRESSES, OrgInvitation } from '@bounty/email';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  bearer,
  deviceAuthorization,
  openAPI,
  multiSession,
  organization as organizationPlugin,
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
import { isReservedSlug } from '@bounty/types/auth';

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
  invitation,
  invite,
  member,
  notification,
  organization,
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

    console.warn(`✅ Synced GitHub handle for user ${userId}: ${githubHandle}`);
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
// Personal Team Auto-Creation
// ============================================================================

/**
 * Create a personal team (organization) for a newly signed-up user.
 *
 * We insert directly into the `organization` and `member` tables via Drizzle
 * because we can't call `auth.api.createOrganization()` from inside a
 * databaseHook (auth is still being constructed at that point).
 *
 * Slug & name derivation:
 * - If the user has a `handle` (e.g., from GitHub OAuth), use it as the slug
 *   and name the team `{handle}'s team`.
 * - Otherwise fall back to the user's email prefix or a UUID-based slug.
 */
async function createPersonalTeam(user: {
  id: string;
  name?: string | null;
  email: string;
  handle?: string | null;
}) {
  const handle =
    (user as { handle?: string | null }).handle ??
    user.email
      .split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

  // If the handle is a reserved slug (collides with static routes like /bounty, /dashboard),
  // suffix it immediately to avoid routing conflicts.
  const baseSlug =
    handle && !isReservedSlug(handle)
      ? handle
      : handle
        ? `${handle}-${crypto.randomUUID().slice(0, 6)}`
        : user.id;
  const teamName = handle ? `${handle}'s team` : `${user.name ?? 'My'}'s team`;

  // Retry up to 2 times for slug collisions
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    const orgId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    try {
      // Atomic: both org + member insert in a single transaction
      await db.transaction(async (tx) => {
        await tx.insert(organization).values({
          id: orgId,
          name: teamName,
          slug,
          isPersonal: true,
          createdAt: new Date(),
        });

        await tx.insert(member).values({
          id: memberId,
          userId: user.id,
          organizationId: orgId,
          role: 'owner',
          createdAt: new Date(),
        });
      });

      if (env.NODE_ENV !== 'production') {
        console.warn(
          `[createPersonalTeam] Created "${teamName}" (${slug}) for user ${user.id}${attempt > 0 ? ' (slug collision retry)' : ''}`
        );
      }
      return; // Success — exit the retry loop
    } catch (error) {
      const isSlugCollision =
        error instanceof Error && error.message.includes('unique');

      if (isSlugCollision && attempt === 0) {
        // Transaction rolled back automatically — retry with a suffixed slug
        continue;
      }

      console.error(
        `Failed to create personal team for user ${user.id}:`,
        error
      );
      return;
    }
  }
}

/**
 * Look up the user's personal team and return its organization ID.
 * Used by the session.create.before hook to auto-set activeOrganizationId.
 */
async function getPersonalTeamId(userId: string): Promise<string | null> {
  const result = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(and(eq(member.userId, userId), eq(organization.isPersonal, true)))
    .limit(1);

  return result[0]?.organizationId ?? null;
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

  user: {
    additionalFields: {
      handle: {
        type: 'string',
        required: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github', 'google', 'discord', 'linear'],
      allowDifferentEmails: true,
    },
  },

  session: AUTH_CONFIG.session,

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create a personal team for every new user
          await createPersonalTeam(user);

          // Send Discord webhook for new signup
          try {
            const webhookUrl = env.DISCORD_WEBHOOK_URL;
            if (webhookUrl) {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  embeds: [
                    {
                      title: 'New User Registered',
                      description: `**${user.name ?? 'Unknown'}** (@${(user as { handle?: string | null }).handle ?? 'unknown'}) joined bounty.new`,
                      color: 0x00_ff_00,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                }),
              });
            }
          } catch {
            // Silently fail — don't block signup
          }
        },
      },
      update: {
        after: async (user) => {
          // If handle changed, sync the personal team slug + name to match
          const handle = (user as { handle?: string | null }).handle;
          if (!handle) return;

          try {
            const personalOrg = await db
              .select({ id: organization.id, slug: organization.slug })
              .from(organization)
              .innerJoin(member, eq(member.organizationId, organization.id))
              .where(
                and(
                  eq(member.userId, user.id),
                  eq(organization.isPersonal, true)
                )
              )
              .limit(1);

            const org = personalOrg[0];
            if (org && org.slug !== handle) {
              // If the new handle is a reserved slug, suffix it immediately
              const targetSlug = isReservedSlug(handle)
                ? `${handle}-${crypto.randomUUID().slice(0, 6)}`
                : handle;

              // Try the target slug first, then a suffixed slug on collision
              for (let attempt = 0; attempt < 2; attempt++) {
                const slug =
                  attempt === 0
                    ? targetSlug
                    : `${handle}-${crypto.randomUUID().slice(0, 6)}`;
                try {
                  await db
                    .update(organization)
                    .set({
                      slug,
                      name: `${handle}'s team`,
                    })
                    .where(eq(organization.id, org.id));

                  if (env.NODE_ENV !== 'production') {
                    console.warn(
                      `[user.update.after] Synced personal team slug: ${org.slug} -> ${slug}${attempt > 0 ? ' (collision retry)' : ''}`
                    );
                  }
                  break; // Success
                } catch (updateErr) {
                  const isSlugCollision =
                    updateErr instanceof Error &&
                    updateErr.message.includes('unique');

                  if (isSlugCollision && attempt === 0) {
                    // Retry with a suffixed slug
                    continue;
                  }
                  throw updateErr; // Re-throw to the outer catch
                }
              }
            }
          } catch (err) {
            // Slug collision or other error — don't break the user update
            console.error(
              '[user.update.after] Failed to sync personal team slug:',
              err
            );
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const isDev = env.NODE_ENV !== 'production';

          if (isDev) {
            console.warn(
              `[session.create.before] userId=${session.userId} activeOrganizationId=${session.activeOrganizationId ?? 'null'}`
            );
          }

          // If no active org is set, default to the user's personal team.
          // For existing users who don't have a personal team yet (pre-org era),
          // auto-create one on first login so it self-heals without a migration.
          if (!session.activeOrganizationId) {
            let personalTeamId = await getPersonalTeamId(session.userId);

            if (!personalTeamId) {
              // Look up user details for team naming
              const sessionUser = await db.query.user.findFirst({
                where: (fields, { eq }) => eq(fields.id, session.userId),
                columns: { id: true, name: true, email: true, handle: true },
              });

              if (isDev) {
                console.warn(
                  `[session.create.before] self-healing: creating personal team for user ${sessionUser?.id ?? session.userId}`
                );
              }

              if (sessionUser) {
                await createPersonalTeam(sessionUser);
                personalTeamId = await getPersonalTeamId(session.userId);
              }
            }

            return {
              data: {
                ...session,
                activeOrganizationId: personalTeamId,
              },
            };
          }
          return { data: session };
        },
      },
    },
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
          // Additional origins from env (comma-separated)
          ...(env.ADDITIONAL_TRUSTED_ORIGINS
            ? env.ADDITIONAL_TRUSTED_ORIGINS.split(',').map((o) => o.trim())
            : []),
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
    // Organization (Teams)
    // ========================================================================
    organizationPlugin({
      creatorRole: 'owner',
      schema: {
        organization: {
          additionalFields: {
            isPersonal: {
              type: 'boolean',
              required: false,
              defaultValue: false,
              input: true,
            },
            stripeCustomerId: {
              type: 'string',
              required: false,
              input: false,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        const inviteUrl = `${AUTH_CONFIG.baseURL}/org/invite/${data.id}`;
        const inviterName = data.inviter.user.name ?? 'Someone';
        const orgName = data.organization.name;
        const role = data.role ?? 'member';

        console.warn(
          `[sendInvitationEmail] ${data.email} invited to ${orgName} by ${inviterName} as ${role}`
        );

        try {
          const result = await sendEmail({
            from: FROM_ADDRESSES.notifications,
            to: data.email,
            subject: `${inviterName} invited you to join ${orgName}`,
            react: OrgInvitation({ inviterName, orgName, role, inviteUrl }),
          });

          if (result.error) {
            console.error(
              '[sendInvitationEmail] Failed:',
              result.error.message
            );
          }
        } catch (err) {
          console.error('[sendInvitationEmail] Error:', err);
        }
      },
      // Organization hooks — slug uniqueness enforced by DB unique constraint.
      // Static Next.js routes always resolve before dynamic [slug] routes,
      // so no reserved slugs list is needed.
    }),

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
        // SECURITY: Fail closed - if no allowed IDs configured, reject all clients
        // This prevents unauthorized device auth when misconfigured
        if (allowedIds.length === 0) {
          console.warn(
            '[Device Auth] No allowed client IDs configured, rejecting client:',
            clientId
          );
          return false;
        }
        return allowedIds.includes(clientId);
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
