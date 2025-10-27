import { actor } from 'rivetkit';
import { z } from 'zod';
import { getNotificationsForUser, getUnreadNotificationCount } from '@bounty/db';

export const notificationsActor = actor({
  state: z.object({
    userId: z.string().default(''),
    lastCheck: z.date().optional(),
  }),
  actions: {
    subscribe: async (c) => {
      // Get userId from the actor key (first element)
      const userId = c.key[0] || c.state.userId;

      // Update state with user ID
      c.state.userId = userId;
      c.state.lastCheck = new Date();

      // Fetch initial notifications and unread count
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(userId, { limit: 50 }),
        getUnreadNotificationCount(userId),
      ]);

      // Emit initial data
      c.broadcast('notifications', notifications);
      c.broadcast('unreadCount', unreadCount);

      return { success: true };
    },

    checkForUpdates: async (c) => {
      if (!c.state.userId) {
        return { success: false, error: 'Not subscribed' };
      }

      // Fetch latest notifications and unread count
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(c.state.userId, { limit: 50 }),
        getUnreadNotificationCount(c.state.userId),
      ]);

      // Emit updated data
      c.broadcast('notifications', notifications);
      c.broadcast('unreadCount', unreadCount);

      c.state.lastCheck = new Date();

      return { success: true };
    },

    notificationCreated: async (c, input: any) => {
      if (!c.state.userId) {
        return { success: false };
      }

      // When a new notification is created, fetch fresh data
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(c.state.userId, { limit: 50 }),
        getUnreadNotificationCount(c.state.userId),
      ]);

      c.broadcast('notifications', notifications);
      c.broadcast('unreadCount', unreadCount);
      c.broadcast('newNotification', input);

      return { success: true };
    },

    notificationRead: async (c, input: any) => {
      if (!c.state.userId) {
        return { success: false };
      }

      // Fetch updated unread count after marking as read
      const unreadCount = await getUnreadNotificationCount(c.state.userId);

      c.broadcast('unreadCount', unreadCount);
      c.broadcast('notificationMarkedRead', input);

      return { success: true };
    },
  },
});
