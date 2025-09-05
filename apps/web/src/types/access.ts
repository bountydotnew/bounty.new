import type { ReactNode } from 'react';

export type AccessStage = 'none' | 'alpha' | 'beta' | 'production';

export interface AccessContextType {
  userStage: AccessStage;
  hasStageAccess: (stage: AccessStage | AccessStage[]) => boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface AccessProviderProps {
  children: ReactNode;
}
