'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AuthGuardProps } from '@bounty/types';
import { useSession } from '@/context/session-context';

/**
 * AuthGuard - Protects client-side routes by checking authentication
 *
 * Redirects unauthenticated users to login page with callback URL.
 * Shows nothing while loading (let page handle its own loading state).
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <DashboardContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  fallback = null,
  redirectTo,
  redirectOnMount = true,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPending } = useSession();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect client-side to avoid hydration issues
    if (typeof window === 'undefined') {
      return;
    }

    if (isPending) {
      return;
    }

    if (isAuthenticated) {
      return;
    }

    if (!redirectOnMount) {
      return;
    }

    if (hasRedirected) {
      return;
    }

    setHasRedirected(true);
    const callbackUrl = encodeURIComponent(pathname);
    const loginUrl = redirectTo || `/login?callback=${callbackUrl}`;
    router.push(loginUrl);
  }, [
    isAuthenticated,
    isPending,
    pathname,
    redirectTo,
    redirectOnMount,
    router,
    hasRedirected,
  ]);

  // Show nothing while loading - let page handle its own loading state
  if (isPending) {
    return <>{fallback}</>;
  }

  // Return null during redirect to avoid flash of content
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
