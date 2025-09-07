'use client';

import type { ReactNode } from 'react';

import type { AccessStage } from '@/types/access';
import { useAccess } from '@/context/access-provider';

interface AccessGateProps {
  /** Required access stage(s). User must have at least one of these stages */
  stage: AccessStage | AccessStage[];
  /** Fallback component to render when access is denied */
  fallback?: ReactNode;
  /** Children to render when access is granted */
  children: ReactNode;
  /** Additional condition that must be true for access */
  condition?: boolean;
  /** Skeleton component to render while loading */
  skeleton?: ReactNode;
}

export const AccessGate = ({
  stage,
  fallback = null,
  children,
  condition = true,
  skeleton,
}: AccessGateProps) => {
  const { hasStageAccess, isLoading } = useAccess();

  // Show skeleton while loading user data
  if (isLoading) {
    return <>{skeleton}</>;
  }

  // Check if user has required stage access and additional condition
  const hasAccess = hasStageAccess(stage) && condition;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
