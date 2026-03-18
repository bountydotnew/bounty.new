'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
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
  const hasRedirectedRef = useRef(false);

  // Redirect unauthenticated users during render
  if (
    !(isPending || isAuthenticated) &&
    redirectOnMount &&
    !hasRedirectedRef.current
  ) {
    hasRedirectedRef.current = true;
    const callbackUrl = encodeURIComponent(pathname);
    const loginUrl = redirectTo || `/login?callback=${callbackUrl}`;
    router.push(loginUrl);
  }

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
