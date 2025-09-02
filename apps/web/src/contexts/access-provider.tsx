"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { authClient } from "@bounty/auth/client";

export type AccessStage = "none" | "alpha" | "beta" | "production";

interface AccessContextType {
  userStage: AccessStage;
  hasStageAccess: (stage: AccessStage | AccessStage[]) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

interface AccessProviderProps {
  children: ReactNode;
}

export const AccessProvider = ({ children }: AccessProviderProps) => {
  const { data: session } = authClient.useSession();

  const userData = useQuery({
    ...trpc.user.getMe.queryOptions(),
    enabled: !!session,
  });

  const userStage: AccessStage = userData.data?.accessStage || "none";

  const hasStageAccess = (stage: AccessStage | AccessStage[]): boolean => {
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
  };

  const contextValue: AccessContextType = {
    userStage,
    hasStageAccess,
    isLoading: userData.isLoading,
    error: userData.error as Error | null,
  };

  return (
    <AccessContext.Provider value={contextValue}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error("useAccess must be used within an AccessProvider");
  }
  return context;
};
