import type { Context } from '../lib/context';

export function getClientIP(ctx: Context): string {
  const clientIP = ctx.clientIP || 'unknown';
  
  console.log("[getClientIP] Client IP from context:", clientIP);
  
  return clientIP;
} 