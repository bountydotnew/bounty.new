'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { NotificationItem } from '@/types/notifications';
import { trpc } from '@/utils/trpc';
import { useRealtime } from '@upstash/realtime/client';
import type { RealtimeEvents, RealtimeSchema } from '@bounty/types/realtime';
import { authClient } from '@bounty/auth/client';

export const useNotifications = () => {
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const notificationsQuery = useQuery({
    ...trpc.notifications.getAll.queryOptions({ limit: 50 }),
    enabled: isAuthenticated && !isPending,
  });

  const unreadCountQuery = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    enabled: isAuthenticated && !isPending,
  });
  const unreadCount = Number(unreadCountQuery.data ?? 0);

  useRealtime<RealtimeSchema, 'notifications.refresh'>({
    enabled: isAuthenticated && !isPending,
    onData: (payload: { data: RealtimeEvents['notifications']['refresh'] }) => {
      if (payload.data.userId === session?.user?.id) {
        notificationsQuery.refetch();
        unreadCountQuery.refetch();
      }
    },
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
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [markAllAsReadMutation, unreadCount]);

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
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    hasError: notificationsQuery.isError || unreadCountQuery.isError,
    error: notificationsQuery.error || unreadCountQuery.error,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  } as const;
};
