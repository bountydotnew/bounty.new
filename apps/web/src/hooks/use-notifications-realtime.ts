'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@bounty/auth/client';
import { rivet } from '@/lib/rivet-client';
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
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  // Rivet event listeners
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const actor = rivet.actor('notifications', { id: session.user.id });

    // Subscribe to notification events
    actor.useEvent('notifications', (data: NotificationItem[]) => {
      setNotifications(data);
      setIsLoading(false);
    });

    actor.useEvent('unreadCount', (count: number) => {
      setUnreadCount(count);
    });

    actor.useEvent('newNotification', () => {
      // Optionally show a toast when new notification arrives
      // toast.info('New notification received');
    });

    // Initial subscription
    actor.action('subscribe', { userId: session.user.id }).catch((err) => {
      console.error('Failed to subscribe to notifications:', err);
      setHasError(true);
      setIsLoading(false);
    });
  }, [session?.user?.id]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!session?.user?.id) return;

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update via Rivet
      const actor = rivet.actor('notifications', { id: session.user.id });
      await actor.action('notificationRead', { id });

      // Also update via tRPC for database persistence
      markAsReadMutation.mutate({ id });
    },
    [session?.user?.id, markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;

    const count = unreadCount;
    if (count === 0) return;

    // Optimistically update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Update via Rivet
    const actor = rivet.actor('notifications', { id: session.user.id });
    await actor.action('checkForUpdates', {});

    // Also update via tRPC for database persistence
    markAllAsReadMutation.mutate();
  }, [session?.user?.id, unreadCount, markAllAsReadMutation]);

  const refetch = useCallback(async () => {
    if (!session?.user?.id) return;

    const actor = rivet.actor('notifications', { id: session.user.id });
    await actor.action('checkForUpdates', {});
  }, [session?.user?.id]);

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
    isLoading,
    hasError,
    error: null,
    markAsRead,
    markAllAsRead,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  } as const;
}
