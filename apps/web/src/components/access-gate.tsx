'use client';

import type { ReactNode } from 'react';
import { useAccess } from '@/context/access-provider';
import type { AccessStage } from '@/types/access';
import type { AccessRequirement } from '@bounty/types';

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
  /** Higher-level access requirements (non-breaking addition) */
  requires?: AccessRequirement[];
  /** Feature flags required */
  flags?: string[];
}

export const AccessGate = ({
  stage,
  fallback = null,
  children,
  condition = true,
  skeleton,
  requires,
  flags,
}: AccessGateProps) => {
  const { hasStageAccess, isLoading, hasFlag, isEmailVerified, isBanned } = useAccess();

  // Show skeleton while loading user data
  if (isLoading) {
    return <>{skeleton}</>;
  }

  // Check if user has required stage access and additional condition
  // Evaluate higher-level requirements if provided
  const requirementsOk = (requires || []).every((req) => {
    switch (req) {
      case 'any_authenticated':
        return hasStageAccess('none');
      case 'beta_access':
        return hasStageAccess(['beta', 'production']);
      case 'email_verified':
        return isEmailVerified;
      case 'not_banned':
        return !isBanned;
      default:
        return true;
    }
  });
  const flagsOk = (flags || []).every((f) => hasFlag(f));
  const hasAccess = hasStageAccess(stage) && requirementsOk && flagsOk && condition;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
