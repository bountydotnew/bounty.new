import { actor } from 'rivetkit';
import { z } from 'zod';
import { getNotificationsForUser, getUnreadNotificationCount } from '@bounty/db';

export const notificationsActor = actor({
  state: z.object({
    userId: z.string().default(''),
    lastCheck: z.date().optional(),
  }),
  actions: {
    subscribe: async ({ state, emit, input }: any) => {
      const userId = input.userId as string;

      // Update state with user ID
      state.userId = userId;
      state.lastCheck = new Date();

      // Fetch initial notifications and unread count
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(userId, { limit: 50 }),
        getUnreadNotificationCount(userId),
      ]);

      // Emit initial data
      emit('notifications', notifications);
      emit('unreadCount', unreadCount);

      return { success: true };
    },

    checkForUpdates: async ({ state, emit }: any) => {
      if (!state.userId) {
        return { success: false, error: 'Not subscribed' };
      }

      // Fetch latest notifications and unread count
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(state.userId, { limit: 50 }),
        getUnreadNotificationCount(state.userId),
      ]);

      // Emit updated data
      emit('notifications', notifications);
      emit('unreadCount', unreadCount);

      state.lastCheck = new Date();

      return { success: true };
    },

    notificationCreated: async ({ state, emit, input }: any) => {
      if (!state.userId) {
        return { success: false };
      }

      // When a new notification is created, fetch fresh data
      const [notifications, unreadCount] = await Promise.all([
        getNotificationsForUser(state.userId, { limit: 50 }),
        getUnreadNotificationCount(state.userId),
      ]);

      emit('notifications', notifications);
      emit('unreadCount', unreadCount);
      emit('newNotification', input);

      return { success: true };
    },

    notificationRead: async ({ state, emit, input }: any) => {
      if (!state.userId) {
        return { success: false };
      }

      // Fetch updated unread count after marking as read
      const unreadCount = await getUnreadNotificationCount(state.userId);

      emit('unreadCount', unreadCount);
      emit('notificationMarkedRead', input);

      return { success: true };
    },
  },
});
