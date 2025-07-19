import type { Context } from '../lib/context';
import { grim } from '@/lib/use-dev-log';

const { log } = grim();

export function getClientIP(ctx: Context): string {
  const clientIP = ctx.clientIP || 'unknown';
  
  log("[getClientIP] Client IP from context:", clientIP);
  
  return clientIP;
} 