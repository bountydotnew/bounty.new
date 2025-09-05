import type { Context } from '@bounty/api/';
import { grim } from '@bounty/dev-logger';

const { log } = grim();

export function getClientIP(ctx: Context): string {
  const clientIP = ctx.clientIP || 'unknown';

  log('[getClientIP] Client IP from context:', clientIP);

  return clientIP;
}
