'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/context/session-context';

/**
 * EarlyAccessGuard - Protects routes by checking for early_access or admin role
 *
 * Redirects users without early access to the early-access-required page.
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

  // Track the last checked session to avoid redundant checks
  const lastCheckedSessionRef = useRef<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect client-side to avoid hydration issues
    if (typeof window === 'undefined') {
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
    if (hasRedirected) {
      return;
    }

    setHasRedirected(true);
    router.push('/early-access-required');
  }, [session, isPending, router, hasRedirected]);

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
