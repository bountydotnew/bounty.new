'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const POLL_MS = 30_000;

export interface BasicNotification {
  id: string;
  read?: boolean;
  createdAt: string | Date;
  title: string;
  message: string;
  type?: string;
  data?: unknown;
}

export interface NotificationsDeps<T extends BasicNotification = BasicNotification> {
  enabled: boolean;
  pollMs?: number;
  list: () => Promise<T[]>;
  unreadCount: () => Promise<number>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications<T extends BasicNotification = BasicNotification>(
  deps: NotificationsDeps<T>
) {
  const pollMs = deps.pollMs ?? POLL_MS;
  const notificationsQuery = useQuery<T[]>({
    queryKey: ['notifications', 'getAll'],
    queryFn: deps.list,
    enabled: deps.enabled,
    refetchInterval: deps.enabled ? pollMs : false,
    refetchIntervalInBackground: false,
    retry: (failureCount) => failureCount < 2,
  });

  const unreadCountQuery = useQuery<number>({
    queryKey: ['notifications', 'getUnreadCount'],
    queryFn: deps.unreadCount,
    enabled: deps.enabled,
    refetchInterval: deps.enabled ? pollMs : false,
    refetchIntervalInBackground: false,
    retry: (failureCount) => failureCount < 2,
  });

  const markAsReadMutation = useMutation({
    mutationFn: deps.markAsRead,
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: deps.markAllAsRead,
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    const count = (unreadCountQuery.data as number | undefined) ?? 0;
    if (count > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [markAllAsReadMutation, unreadCountQuery.data]);

  const refetch = useCallback(() => {
    notificationsQuery.refetch();
    unreadCountQuery.refetch();
  }, [notificationsQuery, unreadCountQuery]);

  useEffect(() => {
    // Only register visibility listener if notifications are enabled
    if (!deps.enabled) {
      return;
    }

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch, deps.enabled]);

  return {
    notifications: (notificationsQuery.data as T[]) ?? [],
    unreadCount: (unreadCountQuery.data as number | undefined) ?? 0,
    isLoading: notificationsQuery.isLoading,
    hasError: notificationsQuery.isError || unreadCountQuery.isError,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  } as const;
}
