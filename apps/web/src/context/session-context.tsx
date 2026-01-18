'use client';

import { authClient } from '@bounty/auth/client';
import { createContext, useContext, type ReactNode } from 'react';

interface SessionContextType {
  session: ReturnType<typeof authClient.useSession>['data'];
  isPending: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider - Provides a single session query at the app root
 * 
 * This ensures all components share the same session query instead of
 * each calling authClient.useSession() independently, which can cause
 * multiple parallel requests before React Query cache is populated.
 * 
 * Better Auth's useSession() hook uses React Query internally and should
 * already share queries across components. This context ensures we only
 * call useSession() once at the root level.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  // Single useSession() call at root - all child components should use
  // useSession() from this context instead of authClient.useSession()
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  return (
    <SessionContext.Provider
      value={{
        session,
        isPending,
        isAuthenticated,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSession - Hook to access session from context
 * 
 * Use this instead of authClient.useSession() directly to ensure
 * all components share the same session query from the root SessionProvider.
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
