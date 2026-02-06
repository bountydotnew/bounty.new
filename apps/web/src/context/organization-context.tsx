'use client';

import { authClient } from '@bounty/auth/client';
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useSession } from '@/context/session-context';
import { toast } from 'sonner';

// Types inferred from Better Auth's organization plugin
type ActiveOrganization = ReturnType<
  typeof authClient.useActiveOrganization
>['data'];
type OrganizationList = ReturnType<
  typeof authClient.useListOrganizations
>['data'];

interface OrganizationContextType {
  activeOrganization: ActiveOrganization;
  isLoadingActive: boolean;
  organizations: OrganizationList;
  isLoadingOrgs: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<boolean>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
}

/**
 * Provides organization state to the app. Only fetches org data when the user
 * is authenticated to avoid unnecessary 401 requests and potential memory issues.
 */
export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { isAuthenticated } = useSession();

  // Local state for manually fetched org data (avoids unconditional hook API calls)
  const [activeOrganization, setActiveOrganization] =
    useState<ActiveOrganization>(null);
  const [organizations, setOrganizations] =
    useState<OrganizationList>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Fetch org data only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveOrganization(null);
      setOrganizations(null);
      setIsLoadingActive(false);
      setIsLoadingOrgs(false);
      return;
    }

    let cancelled = false;

    async function fetchOrgData() {
      setIsLoadingActive(true);
      setIsLoadingOrgs(true);

      try {
        const [activeRes, listRes] = await Promise.all([
          authClient.organization.getFullOrganization(),
          authClient.organization.list(),
        ]);

        if (cancelled) return;

        setActiveOrganization(
          activeRes.error ? null : (activeRes.data ?? null)
        );
        setOrganizations(
          listRes.error ? null : (listRes.data ?? null)
        );
      } catch {
        if (!cancelled) {
          setActiveOrganization(null);
          setOrganizations(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingActive(false);
          setIsLoadingOrgs(false);
        }
      }
    }

    fetchOrgData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const refetchOrgData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [activeRes, listRes] = await Promise.all([
        authClient.organization.getFullOrganization(),
        authClient.organization.list(),
      ]);

      setActiveOrganization(
        activeRes.error ? null : (activeRes.data ?? null)
      );
      setOrganizations(
        listRes.error ? null : (listRes.data ?? null)
      );
    } catch {
      // Silently fail on refetch
    }
  }, [isAuthenticated]);

  const switchOrganization = useCallback(
    async (orgId: string) => {
      try {
        const { error } = await authClient.organization.setActive({
          organizationId: orgId,
        });

        if (error) {
          toast.error('Failed to switch workspace.');
          console.error('Failed to switch organization:', error);
          return;
        }

        await refetchOrgData();
      } catch (error) {
        toast.error('Failed to switch workspace.');
        console.error('Failed to switch organization:', error);
      }
    },
    [refetchOrgData]
  );

  const createOrganization = useCallback(
    async (name: string, slug: string): Promise<boolean> => {
      try {
        const { data, error } = await authClient.organization.create({
          name,
          slug,
        });

        if (error) {
          toast.error('Failed to create workspace.');
          console.error('Failed to create organization:', error);
          return false;
        }

        toast.success('Workspace created successfully.');

        // Auto-switch to the newly created organization
        if (data?.id) {
          await authClient.organization.setActive({
            organizationId: data.id,
          });
        }

        await refetchOrgData();
        return true;
      } catch (error) {
        toast.error('Failed to create workspace.');
        console.error('Failed to create organization:', error);
        return false;
      }
    },
    [refetchOrgData]
  );

  const value = useMemo(
    () => ({
      activeOrganization: activeOrganization ?? null,
      isLoadingActive,
      organizations: organizations ?? null,
      isLoadingOrgs,
      switchOrganization,
      createOrganization,
    }),
    [
      activeOrganization,
      isLoadingActive,
      organizations,
      isLoadingOrgs,
      switchOrganization,
      createOrganization,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      'useOrganization must be used within OrganizationProvider'
    );
  }
  return context;
}
