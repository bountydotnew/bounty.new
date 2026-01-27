import { appRouter } from './routers';
import { db } from '@bounty/db';
import { user } from '@bounty/db/src/schema/auth';
import { eq } from 'drizzle-orm';
import { createCallerFactory } from './trpc';
import type { Context } from './context';

/**
 * Create a tRPC caller for server-side use (e.g., from Discord bot, cron jobs, etc.)
 * This allows calling API endpoints directly without HTTP requests
 */
export async function createServerCaller(userId?: string) {
  let session: Context['session'] = null;

  if (userId) {
    // Fetch the actual user from the database
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord) {
      // Create a session structure that matches Better Auth's session format
      // For server-side calls, we create a minimal session object
      session = {
        session: {
          id: `server-session-${userId}`,
          userId: userRecord.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
          token: `server-token-${userId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: userRecord.id,
          name: userRecord.name ?? '',
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          image: userRecord.image ?? null,
          createdAt: userRecord.createdAt,
          updatedAt: userRecord.updatedAt,
          banned: userRecord.banned,
          banReason: userRecord.banReason ?? null,
          banExpires: userRecord.banExpires ?? null,
          role: userRecord.role as 'user' | 'admin',
        },
      };
    }
  }

  const context: Context = {
    session,
    clientIP: 'server-side',
    requestId: `server_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    req: null as unknown as Context['req'], // Not needed for server-side calls
    db,
  };

  const createCaller = createCallerFactory(appRouter);
  return createCaller(context);
}
