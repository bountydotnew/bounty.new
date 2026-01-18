import type { Client } from 'discord.js';
import { setupCommands } from './commands';

export function bot(client: Client) {
  setupCommands(client);
}
