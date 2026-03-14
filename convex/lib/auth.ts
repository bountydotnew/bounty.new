/**
 * Auth helpers for Convex functions.
 *
 * Replaces the tRPC middleware hierarchy:
 * - publicProcedure → no wrapper needed
 * - protectedProcedure → requireAuth()
 * - adminProcedure → requireAdmin()
 * - earlyAccessProcedure → requireEarlyAccess()
 * - orgProcedure → requireOrgMember()
 * - orgOwnerProcedure → requireOrgOwner()
 *
 * Uses the Better Auth component's session table directly — no JWKS needed.
 */
import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import { authComponent } from '../auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  _id: any; // Id<"users"> — typed as any to avoid codegen dependency
  betterAuthUserId: string;
  handle?: string;
  role: string;
  banned: boolean;
  banReason?: string;
  banExpires?: number;
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  stripeConnectOnboardingComplete: boolean;
  isProfilePrivate: boolean;
  cardBackground?: string;
  updatedAt: number;
  _creationTime: number;
}

export interface OrgContext {
  org: {
    _id: any;
    betterAuthOrgId: string;
    name: string;
    slug: string;
    isPersonal: boolean;
    stripeCustomerId?: string;
  };
  membership: {
    _id: any;
    role: string;
  };
}

// ---------------------------------------------------------------------------
// Core Auth
// ---------------------------------------------------------------------------

/**
 * Get the currently authenticated user from the Better Auth component
 * and resolve their app-level user document.
 *
 * Uses authComponent.getAuthUser() which queries the session table
 * directly — no JWKS/JWT verification needed.
 *
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthUser | null> {
  // Get the Better Auth user from the component's session table
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) return null;

  // Resolve our app-level user document
  const user = await ctx.db
    .query('users')
    .withIndex('by_betterAuthUserId', (q: any) =>
      q.eq('betterAuthUserId', authUser._id)
    )
    .unique();

  return user as AuthUser | null;
}

/**
 * Require an authenticated user. Throws UNAUTHENTICATED if not logged in.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthUser> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new ConvexError('UNAUTHENTICATED');
  }
  if (user.banned) {
    const now = Date.now();
    if (!user.banExpires || user.banExpires > now) {
      throw new ConvexError('BANNED');
    }
  }
  return user;
}

/**
 * Require an admin user. Throws FORBIDDEN if not admin.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<AuthUser> {
  const user = await requireAuth(ctx);
  if (user.role !== 'admin') {
    throw new ConvexError('FORBIDDEN');
  }
  return user;
}

/**
 * Require early access or admin role.
 */
export async function requireEarlyAccess(
  ctx: QueryCtx | MutationCtx
): Promise<AuthUser> {
  const user = await requireAuth(ctx);
  if (user.role !== 'early_access' && user.role !== 'admin') {
    throw new ConvexError('EARLY_ACCESS_REQUIRED');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Organization Auth
// ---------------------------------------------------------------------------

/**
 * Require the user to be a member of their active organization.
 * Returns the user, org, and membership.
 */
export async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  organizationId?: string
): Promise<AuthUser & OrgContext> {
  const user = await requireAuth(ctx);

  // If no org ID provided, find the user's personal org
  let orgDocId = organizationId;
  if (!orgDocId) {
    const membership = await ctx.db
      .query('members')
      .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
      .first();

    if (!membership) {
      throw new ConvexError('NO_ORGANIZATION');
    }
    orgDocId = membership.organizationId as string;
  }

  const org = await ctx.db.get(orgDocId as any);
  if (!org) {
    throw new ConvexError('ORGANIZATION_NOT_FOUND');
  }

  const membership = await ctx.db
    .query('members')
    .withIndex('by_org_user', (q: any) =>
      q.eq('organizationId', org._id).eq('userId', user._id)
    )
    .unique();

  if (!membership) {
    throw new ConvexError('NOT_ORG_MEMBER');
  }

  return Object.assign(user, {
    org: {
      _id: org._id,
      betterAuthOrgId: (org as any).betterAuthOrgId,
      name: (org as any).name,
      slug: (org as any).slug,
      isPersonal: (org as any).isPersonal,
      stripeCustomerId: (org as any).stripeCustomerId,
    },
    membership: {
      _id: membership._id,
      role: (membership as any).role,
    },
  });
}

/**
 * Require the user to be an owner of the active organization.
 */
export async function requireOrgOwner(
  ctx: QueryCtx | MutationCtx,
  organizationId?: string
): Promise<AuthUser & OrgContext> {
  const result = await requireOrgMember(ctx, organizationId);
  if (result.membership.role !== 'owner') {
    throw new ConvexError('NOT_ORG_OWNER');
  }
  return result;
}
