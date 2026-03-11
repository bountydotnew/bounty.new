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
  organizationClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { multiSessionClient } from 'better-auth/client/plugins';
import { env } from '@bounty/env/client';
import { toast } from 'sonner';
import { sentinelClient } from "@better-auth/infra/client";

/**
 * Better Auth client instance
 *
 * Provides:
 * - Authentication methods (signIn, signOut, signUp)
 * - React hooks (useSession, useUser)
 * - Plugin methods (admin, device auth, email OTP, multi-session)
 * - Global error handling with toast notifications
 */
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    adminClient(),
    deviceAuthorizationClient(),
    emailOTPClient(),
    multiSessionClient(),
    organizationClient(),
    sentinelClient(),
  ],
  // Global error handling for all Better Auth requests
  fetchOptions: {
    onError: (ctx) => {
      const { error, response } = ctx;

      // Skip rate limit errors (429) - they're handled elsewhere
      if (response?.status === 429) {
        return;
      }

      // Extract error message
      const errorMessage =
        error?.message ||
        response?.statusText ||
        'An error occurred. Please try again.';

      // Show toast notification for errors
      toast.error(errorMessage);
    },
  },
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
