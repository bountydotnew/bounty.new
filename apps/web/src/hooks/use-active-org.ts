/**
 * useActiveOrg Hook
 *
 * Provides the active organization (team) from the session,
 * along with helpers to switch orgs and list user's orgs.
 *
 * Uses Better Auth's organization plugin on the client side
 * for setActive(), and Convex for data queries.
 */

'use client';

import { authClient } from '@bounty/auth/client';
import { useSession } from '@/context/session-context';
import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { useCallback, useMemo } from 'react';
import { useCustomer } from 'autumn-js/react';

interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isPersonal: boolean;
  createdAt: string;
  role: string;
  memberCount: number;
}

interface UseActiveOrgResult {
  /** The active organization ID from the session */
  activeOrgId: string | null | undefined;
  /** List of orgs the user is a member of */
  orgs: OrgListItem[];
  /** Whether the org list is loading */
  isLoading: boolean;
  /** Switch the active organization. Convex reactivity handles re-renders. */
  switchOrg: (orgId: string) => Promise<void>;
  /** The active org from the list (convenience) */
  activeOrg: OrgListItem | undefined;
  /** Whether the active org is a personal team */
  isPersonalTeam: boolean;
  /** The active org's slug (for URL generation). Falls back to empty string. */
  activeOrgSlug: string;
  /** Generate an org-scoped URL path, e.g. orgUrl('/integrations') => '/{slug}/integrations' */
  orgUrl: (path: string) => string;
}

export function useActiveOrg(): UseActiveOrgResult {
  const { session } = useSession();
  const { refetch: refetchBilling } = useCustomer();

  const activeOrgId = session?.session?.activeOrganizationId;

  // Fetch orgs list via Convex (reactive)
  const data = useQuery(
    api.functions.organization.listMyOrgs,
    session?.user ? {} : 'skip'
  );

  const isLoading = data === undefined && !!session?.user;

  const orgs = useMemo(() => data?.orgs ?? [], [data]);

  const activeOrg = useMemo(
    () => orgs.find((o: OrgListItem) => o.id === activeOrgId),
    [orgs, activeOrgId]
  );

  const isPersonalTeam = activeOrg?.isPersonal ?? true;
  const activeOrgSlug = activeOrg?.slug ?? '';

  /**
   * Generate an org-scoped URL path.
   * e.g. orgUrl('/integrations') => '/{slug}/integrations'
   */
  const orgUrl = useCallback(
    (path: string) => {
      if (!activeOrgSlug) return path;
      return `/${activeOrgSlug}${path.startsWith('/') ? path : `/${path}`}`;
    },
    [activeOrgSlug]
  );

  /**
   * Switch the active organization via Better Auth.
   * This updates the session's activeOrganizationId on the server.
   * Convex reactivity automatically handles re-fetching data for the new org.
   */
  const switchOrg = useCallback(
    async (orgId: string) => {
      await authClient.organization.setActive({
        organizationId: orgId,
      });

      // Refetch billing data (Autumn SDK) for the new org
      refetchBilling();
    },
    [refetchBilling]
  );

  return {
    activeOrgId,
    orgs,
    isLoading,
    switchOrg,
    activeOrg,
    isPersonalTeam,
    activeOrgSlug,
    orgUrl,
  };
}
