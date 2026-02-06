'use client';

import { authClient } from '@bounty/auth/client';
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  /** The currently active organization */
  activeOrganization: ActiveOrganization;
  /** Whether the active organization is loading */
  isLoadingActive: boolean;
  /** All organizations the user belongs to */
  organizations: OrganizationList;
  /** Whether the organizations list is loading */
  isLoadingOrgs: boolean;
  /** Switch to a different organization */
  switchOrganization: (orgId: string) => Promise<void>;
  /** Create a new organization */
  createOrganization: (name: string, slug: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();

  // Use Better Auth's built-in hooks for organization state
  const {
    data: activeOrganization,
    isPending: isLoadingActive,
  } = authClient.useActiveOrganization();

  const {
    data: organizations,
    isPending: isLoadingOrgs,
  } = authClient.useListOrganizations();

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

        // Invalidate all queries to refresh org-dependent data
        queryClient.invalidateQueries();
      } catch (error) {
        toast.error('Failed to switch workspace.');
        console.error('Failed to switch organization:', error);
      }
    },
    [queryClient]
  );

  const createOrganization = useCallback(
    async (name: string, slug: string) => {
      try {
        const { error } = await authClient.organization.create({
          name,
          slug,
        });

        if (error) {
          toast.error('Failed to create workspace.');
          console.error('Failed to create organization:', error);
          return;
        }

        toast.success('Workspace created successfully.');
        // Invalidate to refresh the org list
        queryClient.invalidateQueries();
      } catch (error) {
        toast.error('Failed to create workspace.');
        console.error('Failed to create organization:', error);
      }
    },
    [queryClient]
  );

  const value = useMemo(
    () => ({
      activeOrganization: activeOrganization ?? null,
      isLoadingActive: isAuthenticated ? isLoadingActive : false,
      organizations: organizations ?? null,
      isLoadingOrgs: isAuthenticated ? isLoadingOrgs : false,
      switchOrganization,
      createOrganization,
    }),
    [
      activeOrganization,
      isLoadingActive,
      organizations,
      isLoadingOrgs,
      isAuthenticated,
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
