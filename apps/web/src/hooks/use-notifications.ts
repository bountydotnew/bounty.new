'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from '@/context/toast';
import type { NotificationItem } from '@/types/notifications';
import { trpc, trpcClient } from '@/utils/trpc';
import { useRealtime } from '@upstash/realtime/client';
import type { RealtimeEvents, RealtimeSchema } from '@bounty/types/realtime';
import { showBountyCommentToast } from '@bounty/ui/components/toast/bounty-comment-toast';
import { useSession } from '@/context/session-context';

export const useNotifications = () => {
  const { isAuthenticated, isPending, session } = useSession();
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  const notificationsQuery = useQuery({
    ...trpc.notifications.getAll.queryOptions({ limit: 50 }),
    enabled: isAuthenticated && !isPending,
    staleTime: 1 * 60 * 1000, // 1 minute - notifications can change frequently
  });

  const unreadCountQuery = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    enabled: isAuthenticated && !isPending,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
  const unreadCount = Number(unreadCountQuery.data ?? 0);

  // Initialize previous notification IDs on first load to avoid showing toasts for existing notifications
  useEffect(() => {
    if (notificationsQuery.data && previousNotificationIdsRef.current.size === 0) {
      previousNotificationIdsRef.current = new Set(
        notificationsQuery.data.map((n) => n.id)
      );
    }
  }, [notificationsQuery.data]);

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

  useRealtime<RealtimeSchema, 'notifications.refresh'>({
    enabled: isAuthenticated && !isPending,
    onData: (payload: { data: RealtimeEvents['notifications']['refresh'] }) => {
      if (payload.data.userId === session?.user?.id) {
        // Fetch unread notifications to find new ones
        trpcClient.notifications.getAll
          .query({
            limit: 10,
            offset: 0,
            unreadOnly: true,
          })
          .then((unreadNotifications) => {
            // Find new notifications that weren't in the previous set
            const newNotifications = unreadNotifications.filter(
              (notification) => !previousNotificationIdsRef.current.has(notification.id)
            );

            // Show toast for each new notification
            newNotifications.forEach((notification) => {
              // Extract user info from notification data
              const notificationData = (notification.data || {}) as {
                commentId?: string;
                userId?: string;
                userName?: string;
                userImage?: string;
                [key: string]: unknown;
              };

              // Get user info from notification data, with fallback for backward compatibility
              const user = notificationData.userName
                ? {
                    name: notificationData.userName,
                    image: notificationData.userImage || null,
                  }
                : {
                    name: 'Someone',
                    image: null,
                  };

              showBountyCommentToast({
                user,
                timestamp: notification.createdAt,
                onMarkAsRead: () => markAsRead(notification.id),
              });
            });

            // Update the previous notification IDs set by merging with existing
            previousNotificationIdsRef.current = new Set([
              ...previousNotificationIdsRef.current,
              ...unreadNotifications.map((n) => n.id),
            ]);
          })
          .catch(() => {
            // Silently fail - we'll still refetch below
          });

        // Refetch queries to update UI
        notificationsQuery.refetch();
        unreadCountQuery.refetch();
      }
    },
  });

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
