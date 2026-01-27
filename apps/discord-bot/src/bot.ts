import type { Client } from 'discord.js';
import { setupCommands } from './commands';
import { setupGuildEvents } from './events/guild';

export function bot(client: Client) {
  setupCommands(client);
  setupGuildEvents(client);
}
