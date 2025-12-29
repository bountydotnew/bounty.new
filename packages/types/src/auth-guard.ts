import type { ReactNode } from 'react';

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  redirectOnMount?: boolean;
}

export interface AuthLayoutProps {
  children: ReactNode;
}

