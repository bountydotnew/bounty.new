import { actor } from 'rivetkit';
import { z } from 'zod';
import { getNotificationsForUser, getUnreadNotificationCount } from '@bounty/db';

// Define state schema and type
const stateSchema = z.object({
  lastCheck: z.date().optional(),
});

type State = z.infer<typeof stateSchema>;

// Define input types for actions
const notificationInputSchema = z.object({
  id: z.string(),
});

type NotificationInput = z.infer<typeof notificationInputSchema>;

export const notificationsActor = actor({
  state: stateSchema,
  actions: {
    subscribe: async (c) => {
      // Get userId from the actor key (first element)
      const userId = c.key[0];
      if (!userId) {
        return { success: false, error: 'No userId provided' };
      }

      // Update state with last check time
      (c.state as State).lastCheck = new Date();
      await c.saveState({ immediate: true });

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
      const userId = c.key[0];
      if (!userId) {
        return { success: false, error: 'Not subscribed' };
      }

      // Fetch latest notifications and unread count
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(userId, { limit: 50 }),
        getUnreadNotificationCount(userId),
      ]);

      // Emit updated data
      c.broadcast('notifications', notifications);
      c.broadcast('unreadCount', unreadCount);

      (c.state as State).lastCheck = new Date();
      await c.saveState({ immediate: true });

      return { success: true };
    },

    notificationCreated: async (c, input: NotificationInput) => {
      const userId = c.key[0];
      if (!userId) {
        return { success: false };
      }

      // When a new notification is created, fetch fresh data
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(userId, { limit: 50 }),
        getUnreadNotificationCount(userId),
      ]);

      c.broadcast('notifications', notifications);
      c.broadcast('unreadCount', unreadCount);
      c.broadcast('newNotification', input);

      return { success: true };
    },

    notificationRead: async (c, input: NotificationInput) => {
      const userId = c.key[0];
      if (!userId) {
        return { success: false };
      }

      // Fetch updated unread count after marking as read
      const unreadCount = await getUnreadNotificationCount(userId);

      c.broadcast('unreadCount', unreadCount);
      c.broadcast('notificationMarkedRead', input);

      return { success: true };
    },
  },
});

