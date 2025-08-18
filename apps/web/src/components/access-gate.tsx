"use client";

import { ReactNode } from "react";

import { useAccess, type AccessStage } from "@/contexts/access-provider";

interface AccessGateProps {
  /** Required access stage(s). User must have at least one of these stages */
  stage: AccessStage | AccessStage[];
  /** Fallback component to render when access is denied */
  fallback?: ReactNode;
  /** Children to render when access is granted */
  children: ReactNode;
  /** Additional condition that must be true for access */
  condition?: boolean;
}

export const AccessGate = ({
  stage,
  fallback = null,
  children,
  condition = true,
}: AccessGateProps) => {
  const { hasStageAccess, isLoading } = useAccess();

  // Show nothing while loading user data
  if (isLoading) {
    return null;
  }

  // Check if user has required stage access and additional condition
  const hasAccess = hasStageAccess(stage) && condition;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
