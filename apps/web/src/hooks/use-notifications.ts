'use client';

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from '@/context/toast';
import type { NotificationItem } from '@/types/notifications';
import { api } from '@/utils/convex';
import { showBountyCommentToast } from '@bounty/ui/components/toast/bounty-comment-toast';
import { useSession } from '@/context/session-context';

export const useNotifications = () => {
  const { isAuthenticated, isPending } = useSession();
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  // Convex reactive queries — automatically update when data changes.
  // No SSE/Upstash Realtime needed. When a notification is inserted
  // server-side, these queries re-run and the component re-renders.
  const notifications = useQuery(
    api.functions.notifications.getAll,
    isAuthenticated && !isPending ? { limit: 50 } : 'skip'
  );

  const unreadCountResult = useQuery(
    api.functions.notifications.getUnreadCount,
    isAuthenticated && !isPending ? {} : 'skip'
  );
  const unreadCount = unreadCountResult?.count ?? 0;

  // Show toasts for new notifications that appear via reactive updates
  useEffect(() => {
    if (!notifications) return;

    if (previousNotificationIdsRef.current.size === 0) {
      // First load — seed the set without showing toasts
      previousNotificationIdsRef.current = new Set(
        notifications.map((n: any) => n._id)
      );
      return;
    }

    // Find new notifications
    const newNotifications = notifications.filter(
      (n: any) => !(previousNotificationIdsRef.current.has(n._id) || n.read)
    );

    for (const notification of newNotifications) {
      const data = (notification.data || {}) as {
        userName?: string;
        userImage?: string;
        [key: string]: unknown;
      };

      const user = data.userName
        ? { name: data.userName, image: data.userImage || null }
        : { name: 'Someone', image: null };

      showBountyCommentToast({
        user,
        timestamp: notification._creationTime,
        onMarkAsRead: () => markAsRead(notification._id),
      });
    }

    // Update the tracking set
    previousNotificationIdsRef.current = new Set(
      notifications.map((n: any) => n._id)
    );
  }, [notifications]);

  const markAsReadMutation = useMutation(
    api.functions.notifications.markAsRead
  );
  const markAllAsReadMutation = useMutation(
    api.functions.notifications.markAllAsRead
  );

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation({ id: id as any }).catch(() =>
        toast.error('Failed to mark as read')
      );
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsReadMutation({})
        .then(() => toast.success('All notifications marked as read'))
        .catch(() => toast.error('Failed to mark all as read'));
    }
  }, [markAllAsReadMutation, unreadCount]);

  return {
    notifications: (notifications ?? []) as NotificationItem[],
    unreadCount,
    isLoading: notifications === undefined,
    hasError: false, // Convex handles errors via ErrorBoundary
    error: null,
    markAsRead,
    markAllAsRead,
    refetch: () => {}, // No-op: Convex queries are reactive
    isMarkingAsRead: false,
    isMarkingAllAsRead: false,
  } as const;
};
