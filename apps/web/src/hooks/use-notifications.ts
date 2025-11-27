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

  useRealtime<RealtimeSchema, 'notifications.refresh'>({
    event: 'notifications.refresh',
    history: false,
    enabled: isAuthenticated && !isPending,
    onData: ({ data }) => {
      const payload = data as RealtimeEvents['notifications']['refresh'];
      if (payload.userId && payload.userId === session?.user?.id) {
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
};
