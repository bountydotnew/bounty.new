/**
 * Better Auth Client Configuration
 *
 * Client-side auth instance for React applications.
 * All plugins must match those configured on the server.
 */

import {
  adminClient,
  deviceAuthorizationClient,
  emailOTPClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { multiSessionClient } from 'better-auth/client/plugins';
import { env } from '@bounty/env/client';

/**
 * Better Auth client instance
 *
 * Provides:
 * - Authentication methods (signIn, signOut, signUp)
 * - React hooks (useSession, useUser)
 * - Plugin methods (admin, device auth, email OTP, multi-session)
 */
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    adminClient(),
    deviceAuthorizationClient(),
    emailOTPClient(),
    multiSessionClient(),
  ],
});

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Re-export commonly used types from Better Auth
 */
export type {
  Session,
  User,
} from 'better-auth/types';
