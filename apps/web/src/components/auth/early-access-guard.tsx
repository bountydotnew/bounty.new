'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSession } from '@/context/session-context';

/**
 * EarlyAccessGuard - Protects routes by checking for early_access or admin role
 *
 * When NEXT_PUBLIC_EARLY_ACCESS_ENABLED is "false", bypasses all checks (public mode).
 * Otherwise, redirects users without early access to the early-access-required page.
 * Shows nothing while loading.
 */
export function EarlyAccessGuard({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const router = useRouter();
  const { session, isPending } = useSession();

  // Check if early access mode is enabled (default: true unless explicitly set to "false")
  const isEarlyAccessEnabled =
    process.env.NEXT_PUBLIC_EARLY_ACCESS_ENABLED !== 'false';

  // Track the last checked session and redirect state via refs to avoid cascading setState
  const lastCheckedSessionRef = useRef<string | null>(null);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // If early access is disabled, allow everyone
    if (!isEarlyAccessEnabled) {
      return;
    }

    if (isPending) {
      return;
    }

    // No session - let AuthGuard handle it
    if (!session?.user) {
      return;
    }

    // Create a unique identifier for this session state
    const sessionKey = `${session.user.id}-${session.user.role}`;

    // Skip if we've already checked this exact session state
    if (lastCheckedSessionRef.current === sessionKey) {
      return;
    }

    // Mark this session as checked
    lastCheckedSessionRef.current = sessionKey;

    const userRole = session.user.role ?? 'user';

    // Allow early_access and admin roles
    if (userRole === 'early_access' || userRole === 'admin') {
      return;
    }

    // Don't redirect if already redirected
    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    router.push('/early-access-required');
  }, [session, isPending, router, isEarlyAccessEnabled]);

  // If early access is disabled, allow everyone
  if (!isEarlyAccessEnabled) {
    return <>{children}</>;
  }

  // Show nothing while loading
  if (isPending) {
    return <>{fallback}</>;
  }

  // No session - let AuthGuard handle it
  if (!session?.user) {
    return <>{children}</>;
  }

  const userRole = session.user.role ?? 'user';

  // Allow early_access and admin roles
  if (userRole === 'early_access' || userRole === 'admin') {
    return <>{children}</>;
  }

  // Return null during redirect
  return null;
}
