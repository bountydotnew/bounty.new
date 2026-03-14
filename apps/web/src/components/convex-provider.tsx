'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

/**
 * Convex provider for the app.
 *
 * Wraps children with ConvexProvider for reactive queries and mutations.
 *
 * NOTE: When the client-side migration is complete, upgrade this to use
 * ConvexBetterAuthProvider from @convex-dev/better-auth/react which
 * handles auth state sync between Better Auth and Convex automatically.
 *
 * This replaces:
 * - QueryClientProvider (Convex handles caching/reactivity)
 * - RealtimeProvider (Convex queries are reactive by default)
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

/**
 * Export the Convex client for use in server-side utilities.
 */
export { convex };
