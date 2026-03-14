/**
 * Better Auth integration for Convex.
 *
 * This module sets up the @convex-dev/better-auth component and exposes
 * the auth client for use in Convex functions.
 *
 * The Better Auth component manages its own tables (user, session, account,
 * verification, passkey, rateLimit) in an isolated namespace. Triggers let
 * us run mutations in our app's context when those tables change.
 */
import { createClient, type AuthFunctions } from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';
import { components, internal } from './_generated/api';

// The authFunctions reference points to our triggersApi() exports below.
// This creates internal mutations that the component calls when data changes.
const authFunctions: AuthFunctions = internal.auth;

/**
 * The Better Auth component client.
 *
 * Use this to:
 * - Get the authenticated user: `authComponent.getAuthUser(ctx)`
 * - Register HTTP routes: `authComponent.registerRoutes(http, createAuth)`
 * - Access the Convex adapter: `authComponent.adapter(ctx)`
 */
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    // -----------------------------------------------------------------------
    // User lifecycle triggers
    //
    // These fire when Better Auth creates/updates/deletes a user in its
    // component table. We use them to sync our app-level `users` table.
    // -----------------------------------------------------------------------
    user: {
      onCreate: async (ctx, doc) => {
        // Check if we already have an app-level user for this Better Auth user
        const existing = await ctx.db
          .query('users')
          .withIndex('by_betterAuthUserId', (q: any) =>
            q.eq('betterAuthUserId', doc._id)
          )
          .unique();

        if (existing) return;

        const now = Date.now();

        // Create the app-level user document
        const userId = await ctx.db.insert('users', {
          betterAuthUserId: doc._id as string,
          handle: doc.username ?? undefined,
          isProfilePrivate: false,
          role: 'user',
          banned: false,
          stripeConnectOnboardingComplete: false,
          updatedAt: now,
        });

        // Create a personal organization for the user
        const handle = doc.username || doc.email?.split('@')[0] || 'user';
        const slugSuffix = Math.random().toString(36).substring(2, 10);
        const slug = `${handle}-${slugSuffix}`.toLowerCase();

        const orgId = await ctx.db.insert('organizations', {
          betterAuthOrgId: `personal-${doc._id}`,
          name: `${handle}'s team`,
          slug,
          isPersonal: true,
        });

        // Add the user as owner of their personal org
        await ctx.db.insert('members', {
          userId,
          organizationId: orgId,
          role: 'owner',
        });

        // Create initial reputation record
        await ctx.db.insert('userReputation', {
          userId,
          totalEarnedCents: 0n,
          bountiesCompleted: 0,
          bountiesCreated: 0,
          averageRating: 0,
          totalRatings: 0,
          successRate: 0,
          completionRate: 0,
          updatedAt: now,
        });
      },

      onUpdate: async (ctx, newDoc, oldDoc) => {
        const user = await ctx.db
          .query('users')
          .withIndex('by_betterAuthUserId', (q: any) =>
            q.eq('betterAuthUserId', newDoc._id)
          )
          .unique();

        if (!user) return;

        // Sync handle if changed
        if (newDoc.username && newDoc.username !== oldDoc.username) {
          await ctx.db.patch(user._id, {
            handle: newDoc.username,
            updatedAt: Date.now(),
          });

          // Update personal org slug to match new handle
          const memberships = await ctx.db
            .query('members')
            .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
            .collect();

          for (const membership of memberships) {
            const org = await ctx.db.get(membership.organizationId);
            if (org && org.isPersonal) {
              const slugSuffix = Math.random().toString(36).substring(2, 10);
              await ctx.db.patch(org._id, {
                slug: `${newDoc.username}-${slugSuffix}`.toLowerCase(),
                name: `${newDoc.username}'s team`,
              });
              break;
            }
          }
        }
      },
    },
  },
});

// Export trigger API — these internal mutations are called by the component
// when auth data changes, which in turn invoke our trigger callbacks above.
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

// Export client API for React components (used in ConvexBetterAuthProvider)
export const { getAuthUser } = authComponent.clientApi();
