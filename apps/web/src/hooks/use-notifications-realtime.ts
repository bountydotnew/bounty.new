'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@bounty/auth/client';
import { useActor } from '@/lib/rivet-client';
import { trpc } from '@/utils/trpc';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  data: Record<string, unknown> | null;
}

export function useNotificationsRealtime() {
  const { data: session } = authClient.useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const userId = session?.user?.id;
  
  const actor = useActor({
    name: 'notifications',
    key: [userId || 'cheerful-leopardon'],
    enabled: !!userId,
  });

  // Debug logging
  useEffect(() => {
    console.log('[Notifications] Hook state:', {
      userId,
      isConnected: actor.isConnected,
      hasConnection: !!actor.connection,
      notificationsCount: notifications.length,
      unreadCount,
    });
  }, [userId, actor.isConnected, actor.connection, notifications.length, unreadCount]);

  const markAsReadMutation = useMutation(
    trpc.notifications.markAsRead.mutationOptions({
      onError: () => toast.error('Failed to mark as read'),
    })
  );

  const markAllAsReadMutation = useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({
      onSuccess: () => {
        toast.success('All notifications marked as read');
      },
      onError: () => toast.error('Failed to mark all as read'),
    })
  );

  // Subscribe to notification events
  actor.useEvent('notifications', (data: NotificationItem[]) => {
    setNotifications(data);
  });

  actor.useEvent('unreadCount', (count: number) => {
    setUnreadCount(count);
  });

  actor.useEvent('newNotification', () => {
    // Optionally show a toast when new notification arrives
    // toast.info('New notification received');
  });

  // Initial subscription when actor connects
  useEffect(() => {
    if (actor.connection && userId) {
      console.log('[Notifications] Subscribing with userId:', userId);
      actor.connection.subscribe()
        .then(() => {
          console.log('[Notifications] Subscribe successful');
        })
        .catch((err: Error) => {
          console.error('[Notifications] Failed to subscribe:', err);
          setHasError(true);
        });
    } else {
      console.log('[Notifications] Not subscribing - connection:', !!actor.connection, 'userId:', userId);
    }
  }, [actor.connection, userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!actor.connection) {
        return;
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update via Rivet
      await actor.connection.notificationRead({ id });

      // Also update via tRPC for database persistence
      markAsReadMutation.mutate({ id });
    },
    [actor.connection, markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!actor.connection) {
      return;
    }

    const count = unreadCount;
    if (count === 0) {
      return;
    }

    // Optimistically update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Update via Rivet
    await actor.connection.checkForUpdates();

    // Also update via tRPC for database persistence
    markAllAsReadMutation.mutate();
  }, [actor.connection, unreadCount, markAllAsReadMutation]);

  const refetch = useCallback(async () => {
    if (!actor.connection) {
      return;
    }

    await actor.connection.checkForUpdates();
  }, [actor.connection]);

  // Handle visibility change
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
    notifications,
    unreadCount,
    isLoading: !actor.isConnected,
    hasError,
    error: null,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  } as const;
}
