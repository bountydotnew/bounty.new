'use client';

import { authClient } from '@bounty/auth/client';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import type { AccessContextType, AccessProviderProps, AccessStage } from '@/types/access';
import type { AccessProfile } from '@bounty/types';
import { trpc } from '@/utils/trpc';
import { usePrefetchInitialData } from '@/hooks/use-initial-data';

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider = ({ children }: AccessProviderProps) => {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // Prefetch initial data (batched request)
  usePrefetchInitialData();

  const accessProfile = useQuery({
    ...trpc.user.getAccessProfile.queryOptions(),
    enabled: !!session,
    retry: false,
    throwOnError: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - reuse cached data
  });

  const profile = (accessProfile.data as AccessProfile | undefined) || undefined;
  const userStage: AccessStage = profile?.stage || 'none';

  const hasStageAccess = useMemo(() => (
    (stage: AccessStage | AccessStage[]): boolean => {
    const requiredStages = Array.isArray(stage) ? stage : [stage];

    // Define stage hierarchy: production > beta > alpha > none
    const stageHierarchy: Record<AccessStage, number> = {
      none: 0,
      alpha: 1,
      beta: 2,
      production: 3,
    };

    const userLevel = stageHierarchy[userStage];

    // User has access if their stage level meets or exceeds any required stage
    return requiredStages.some((requiredStage) => {
      const requiredLevel = stageHierarchy[requiredStage];
      return userLevel >= requiredLevel;
    });
    }
  ), [userStage]);

  const contextValue: AccessContextType = useMemo(() => ({
    userStage,
    hasStageAccess,
    hasFlag: (flag: string) => Boolean(profile?.featureFlags?.includes(flag)),
    isEmailVerified: Boolean(profile?.emailVerified),
    isBanned: Boolean(profile?.banned),
    isAuthenticated: userStage !== "none",
    isLoading: sessionLoading || accessProfile.isLoading,
    error: accessProfile.error as Error | null,
  }), [userStage, hasStageAccess, profile?.featureFlags, profile?.emailVerified, profile?.banned, sessionLoading, accessProfile.isLoading, accessProfile.error]);

  return (
    <AccessContext.Provider value={contextValue}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};
