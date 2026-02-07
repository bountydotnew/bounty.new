'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@bounty/auth/client';
import { useActiveOrg } from '@/hooks/use-active-org';

interface OrgSyncGuardProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * Syncs the active organization based on the URL slug.
 *
 * On mount (and when slug changes), checks if the active org matches
 * the URL slug. If not, calls setActive() to switch. If the slug
 * doesn't match any of the user's orgs, redirects to /dashboard.
 */
export function OrgSyncGuard({ slug, children }: OrgSyncGuardProps) {
  const { activeOrg, orgs, isLoading, switchOrg } = useActiveOrg();
  const router = useRouter();
  // Start synced if the active org already matches the slug (avoids spinner flash)
  const [synced, setSynced] = useState(() => activeOrg?.slug === slug);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (isLoading || syncingRef.current) return;

    // Find the org matching the URL slug
    const targetOrg = orgs.find((o) => o.slug === slug);

    if (!targetOrg) {
      // Slug doesn't match any user org — redirect to dashboard
      router.replace('/dashboard');
      return;
    }

    if (activeOrg?.slug === slug) {
      // Already synced
      setSynced(true);
      return;
    }

    // Need to switch to this org
    syncingRef.current = true;
    switchOrg(targetOrg.id)
      .then(() => {
        setSynced(true);
      })
      .catch((err) => {
        console.error('Failed to sync org from slug:', err);
        router.replace('/dashboard');
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [slug, activeOrg?.slug, orgs, isLoading, switchOrg, router]);

  if (!synced) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
