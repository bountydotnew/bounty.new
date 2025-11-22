'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useInitialData } from '@/hooks/use-initial-data';

interface UserContextType {
  user: ReturnType<typeof useInitialData>['me'];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { me, isLoading, isError, error } = useInitialData();

  return (
    <UserContext.Provider
      value={{
        user: me,
        isLoading,
        isError,
        error: error instanceof Error ? error : null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

