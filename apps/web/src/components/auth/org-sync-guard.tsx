'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
 *
 * Handles race conditions:
 * - Waits for orgs to finish loading before deciding (no redirect while loading)
 * - Uses a ref to prevent concurrent switchOrg calls
 * - Resets synced state when slug changes
 */
export function OrgSyncGuard({ slug, children }: OrgSyncGuardProps) {
  const { activeOrg, orgs, isLoading, switchOrg } = useActiveOrg();
  const router = useRouter();
  // Start synced if the active org already matches the slug (avoids spinner flash)
  const [synced, setSynced] = useState(() => activeOrg?.slug === slug);
  const syncingRef = useRef(false);
  const lastSlugRef = useRef(slug);

  // Reset synced state when slug changes (navigating between orgs)
  useEffect(() => {
    if (lastSlugRef.current !== slug) {
      lastSlugRef.current = slug;
      // Only reset if the new slug doesn't already match
      if (activeOrg?.slug !== slug) {
        setSynced(false);
        syncingRef.current = false;
      }
    }
  }, [slug, activeOrg?.slug]);

  useEffect(() => {
    if (syncingRef.current) return;

    // Don't make any decisions while orgs are still loading.
    // This prevents premature redirects when the orgs list is temporarily
    // empty (e.g. after invalidateQueries during an org switch).
    if (isLoading) return;

    // Orgs loaded but list is empty — should not happen for authenticated
    // users (they always have a personal team), but guard against it.
    if (orgs.length === 0) return;

    // Find the org matching the URL slug
    const targetOrg = orgs.find((o) => o.slug === slug);

    if (!targetOrg) {
      // Slug doesn't match any user org — redirect to dashboard
      router.replace('/dashboard');
      return;
    }

    if (activeOrg?.slug === slug) {
      // Already synced
      if (!synced) setSynced(true);
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
  }, [slug, activeOrg?.slug, orgs, isLoading, switchOrg, router, synced]);

  if (!synced) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
