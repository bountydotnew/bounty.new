import { setup } from 'rivetkit';
import { notificationsActor } from './notifications-actor';

export const registry = setup({
  use: {
    notifications: notificationsActor,
  },
});

export type Registry = typeof registry;
