import { appRouter } from './routers';
import { db } from '@bounty/db';
import { user } from '@bounty/db/src/schema/auth';
import { eq } from 'drizzle-orm';
import { createCallerFactory } from './trpc';
import type { Context } from './context';

/**
 * Create a synthetic session for server-side API calls
 * Mirrors the Better Auth session structure for compatibility
 */
function createServerSession(userRecord: typeof user.$inferSelect): NonNullable<Context['session']> {
  return {
    session: {
      id: `server-session-${userRecord.id}`,
      userId: userRecord.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      token: `server-token-${userRecord.id}`,
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

/**
 * Create a tRPC caller for server-side use (e.g., from Discord bot, cron jobs, etc.)
 * This allows calling API endpoints directly without HTTP requests
 */
export async function createServerCaller(userId?: string) {
  let session: Context['session'] = null;

  if (userId) {
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord) {
      session = createServerSession(userRecord);
    }
  }

  const context: Context = {
    session,
    clientIP: 'server-side',
    req: null as unknown as Context['req'],
    db,
  };

  const createCaller = createCallerFactory(appRouter);
  return createCaller(context);
}
