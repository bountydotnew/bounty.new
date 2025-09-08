'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export function useAccess() {
  const { data, isLoading, error } = useQuery(
    trpc.user.hasAccess.queryOptions()
  );

  return {
    hasAccess: data?.hasAccess ?? false,
    isLoading,
    error,
  };
}

export function useCurrentUser() {
  const { data, isLoading, error } = useQuery(
    trpc.user.getCurrentUser.queryOptions()
  );

  return {
    user: data,
    isLoading,
    error,
  };
}
