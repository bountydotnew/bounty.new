'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { NotificationItem } from '@/types/notifications';
import { trpc } from '@/utils/trpc';

const POLL_MS = 30_000;

export function useNotifications() {
  const notificationsQuery = useQuery({
    ...trpc.notifications.getAll.queryOptions({ limit: 50 }),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const unreadCountQuery = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const markAsReadMutation = useMutation(
    trpc.notifications.markAsRead.mutationOptions({
      onSuccess: () => {
        notificationsQuery.refetch();
        unreadCountQuery.refetch();
      },
      onError: () => toast.error('Failed to mark as read'),
    })
  );

  const markAllAsReadMutation = useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({
      onSuccess: () => {
        notificationsQuery.refetch();
        unreadCountQuery.refetch();
        toast.success('All notifications marked as read');
      },
      onError: () => toast.error('Failed to mark all as read'),
    })
  );

  const markAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate({ id }),
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    const count = unreadCountQuery.data ?? 0;
    if (count > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [markAllAsReadMutation, unreadCountQuery.data]);

  const refetch = useCallback(() => {
    notificationsQuery.refetch();
    unreadCountQuery.refetch();
  }, [notificationsQuery, unreadCountQuery]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refetch]);

  return {
    notifications: (notificationsQuery.data ?? []) as NotificationItem[],
    unreadCount: unreadCountQuery.data ?? 0,
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
