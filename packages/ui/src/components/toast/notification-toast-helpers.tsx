'use client';

import { showBountyLikedToast, type BountyLikedToastProps } from './bounty-liked-toast';
import { showBountyCommentToast, type BountyCommentToastProps } from './bounty-comment-toast';
import { showBountyReportedToast, type BountyReportedToastProps } from './bounty-reported-toast';
import { NotificationToast } from './notification-toast';
import type { ExternalToast } from 'sonner';
import { toast as sonnerToast } from 'sonner';
import { Bell } from 'lucide-react';

export type NotificationToastUser = {
  name: string;
  image?: string | null;
};

export type NotificationToastData = {
  user: NotificationToastUser;
  timestamp: Date | string;
  onMarkAsRead?: () => void;
};

/**
 * Show a notification toast based on notification type
 * 
 * @example
 * showNotificationToast({
 *   type: 'bounty_comment',
 *   user: { name: 'John Doe', image: 'https://...' },
 *   timestamp: new Date(),
 *   onMarkAsRead: () => markAsRead(notificationId),
 * });
 */
export function showNotificationToast(
  type: string,
  data: NotificationToastData,
  toastOptions?: ExternalToast
) {
  switch (type) {
    case 'bounty_comment': {
      const baseProps = {
        user: data.user,
        timestamp: data.timestamp,
        isReply: false as const, // Could be determined from notification data if available
      };
      const commentProps = data.onMarkAsRead
        ? { ...baseProps, onMarkAsRead: data.onMarkAsRead }
        : baseProps;
      return showBountyCommentToast(commentProps as BountyCommentToastProps, toastOptions);
    }

    case 'bounty_liked':
    case 'bounty_voted': {
      const baseProps = {
        user: data.user,
        timestamp: data.timestamp,
      };
      const likedProps = data.onMarkAsRead
        ? { ...baseProps, onMarkAsRead: data.onMarkAsRead }
        : baseProps;
      return showBountyLikedToast(likedProps as BountyLikedToastProps, toastOptions);
    }

    case 'bounty_reported': {
      const baseProps = {
        user: data.user,
        timestamp: data.timestamp,
      };
      const reportedProps = data.onMarkAsRead
        ? { ...baseProps, onMarkAsRead: data.onMarkAsRead }
        : baseProps;
      return showBountyReportedToast(reportedProps as BountyReportedToastProps, toastOptions);
    }

    default:
      // Fallback to generic notification toast
      return sonnerToast.custom(
        (id) => (
          <NotificationToast
            id={id}
            user={data.user}
            message={`${data.user.name} performed an action`}
            timestamp={data.timestamp}
            actionIcon={<Bell className="size-2.5 text-white" />}
            onDismiss={() => sonnerToast.dismiss(id)}
            onMarkAsRead={() => {
              data.onMarkAsRead?.();
              sonnerToast.dismiss(id);
            }}
          />
        ),
        {
          duration: 5000,
          ...toastOptions,
        }
      );
  }
}
