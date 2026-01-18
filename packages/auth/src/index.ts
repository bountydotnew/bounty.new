/**
 * @bounty/auth
 *
 * Better Auth integration for the Bounty platform.
 *
 * ## Usage
 *
 * ### Client-side (React)
 * ```ts
 * import { authClient } from '@bounty/auth/client';
 * import { useSession } from '@bounty/auth/client';
 *
 * // Get session
 * const { data: session } = useSession();
 *
 * // Sign in
 * await authClient.signIn.email({ email, password });
 *
 * // Sign out
 * await authClient.signOut();
 * ```
 *
 * ### Server-side (Next.js App Router)
 * ```ts
 * import { getServerSession, getServerUser } from '@bounty/auth/server-utils';
 *
 * const session = await getServerSession();
 * const user = await getServerUser();
 * ```
 *
 * ### Server-side (tRPC / API Routes)
 * ```ts
 * import { auth } from '@bounty/auth/server';
 *
 * const session = await auth.api.getSession({ headers: request.headers });
 * ```
 *
 * ## Types
 * ```ts
 * import type { AuthSession, AuthUser } from '@bounty/auth/server';
 * ```
 */

// ============================================================================
// Public Exports
// ============================================================================

// Server exports (includes AuthSession, AuthUser types)
export * from './server';

// Client exports (includes authClient, Session, User types)
export { authClient } from './client';

// Server utilities (includes getServerSession, getServerUser, etc.)
export {
  getServerSession,
  getServerUser,
  isServerAuthenticated,
} from './server-utils';

// Config exports
export * from './config';
