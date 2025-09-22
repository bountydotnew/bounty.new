import {
  bounty,
  db,
  invite,
  session,
  user,
  userProfile,
  userReputation,
} from '@bounty/db';
import { ExternalInvite, FROM_ADDRESSES, sendEmail } from '@bounty/email';
import { env } from '@bounty/env/server';
import { TRPCError } from '@trpc/server';
import { count, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../trpc';

export const userRouter = router({
  adminGetProfile: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [u] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          hasAccess: user.hasAccess,
          accessStage: user.accessStage,
          betaAccessStatus: user.betaAccessStatus,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.id, input.userId))
        .limit(1);
      if (!u) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const bountyCount = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(bounty)
        .where(eq(bounty.createdById, input.userId))
        .then((r) => r[0]?.c ?? 0);

      const sessions = await db
        .select({
          id: session.id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        })
        .from(session)
        .where(eq(session.userId, input.userId))
        .orderBy(desc(session.createdAt))
        .limit(10);

      return {
        user: u,
        metrics: { bountiesCreated: bountyCount },
        sessions,
      };
    }),

  adminUpdateName: adminProcedure
    .input(
      z.object({ userId: z.string().uuid(), name: z.string().min(1).max(80) })
    )
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(user)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(user.id, input.userId))
        .returning({ id: user.id, name: user.name });
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return updated;
    }),
  hasAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userRecord = await db
      .select({ hasAccess: user.hasAccess })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      success: true,
      hasAccess: userRecord[0].hasAccess,
    };
  }),

  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    try {
      // Return null if user is not authenticated
      if (!ctx.session?.user?.id) {
        return {
          success: true,
          data: null,
        };
      }

      const userId = ctx.session.user.id;

      const [userRecord] = await db
        .select({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            hasAccess: user.hasAccess,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          profile: userProfile,
          reputation: userReputation,
        })
        .from(user)
        .leftJoin(userProfile, eq(user.id, userProfile.userId))
        .leftJoin(userReputation, eq(user.id, userReputation.userId))
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        success: true,
        data: userRecord,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch current user',
        cause: error,
      });
    }
  }),

  getUserSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await db
        .select({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })
        .from(session)
        .where(eq(session.userId, ctx.session.user.id))
        .orderBy(desc(session.createdAt));

      return {
        success: true,
        data: sessions,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user sessions',
        cause: error,
      });
    }
  }),

  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [sessionToRevoke] = await db
          .select()
          .from(session)
          .where(eq(session.id, input.sessionId));

        if (!sessionToRevoke) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session not found',
          });
        }

        if (sessionToRevoke.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only revoke your own sessions',
          });
        }

        await db.delete(session).where(eq(session.id, input.sessionId));

        return {
          success: true,
          message: 'Session revoked successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke session',
          cause: error,
        });
      }
    }),

  getUserStats: adminProcedure.query(async ({ ctx }) => {
    try {
      const [stats] = await db
        .select({
          totalUsers: sql<number>`count(*)`,
        })
        .from(user);

      const [userRep] = await db
        .select()
        .from(userReputation)
        .where(eq(userReputation.userId, ctx.session.user.id));

      return {
        success: true,
        data: {
          platformStats: {
            totalUsers: stats.totalUsers,
          },
          userStats: userRep || {
            totalEarned: '0.00',
            bountiesCompleted: 0,
            bountiesCreated: 0,
            averageRating: '0.00',
            totalRatings: 0,
            successRate: '0.00',
            completionRate: '0.00',
          },
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user stats',
        cause: error,
      });
    }
  }),

  updateUserAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        hasAccess: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = await db
          .select()
          .from(user)
          .where(eq(user.id, ctx.session.user.id))
          .limit(1);

        if (!currentUser[0]?.hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "You don't have permission to update user access",
          });
        }

        await db
          .update(user)
          .set({
            hasAccess: input.hasAccess,
            updatedAt: new Date(),
          })
          .where(eq(user.id, input.userId));

        return {
          success: true,
          message: 'User access updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user access',
          cause: error,
        });
      }
    }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const userData = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.session.user.id),
    });

    if (!userData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return userData;
  }),

  getAllUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, limit } = input;
      const offset = (page - 1) * limit;

      let whereClause;
      if (search) {
        whereClause = sql`(${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`})`;
      }

      const [users, total] = await Promise.all([
        ctx.db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            hasAccess: user.hasAccess,
            betaAccessStatus: user.betaAccessStatus,
            accessStage: user.accessStage,
            banned: user.banned,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })
          .from(user)
          .where(whereClause)
          .orderBy(desc(user.createdAt))
          .limit(limit)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(user)
          .where(whereClause)
          .then((result) => result[0]?.count || 0),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['user', 'admin']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      await ctx.db.update(user).set({ role }).where(eq(user.id, userId));

      return { success: true };
    }),

  inviteUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        accessStage: z.enum(['none', 'alpha', 'beta', 'production']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, accessStage } = input;

      const [updatedUser] = await ctx.db
        .update(user)
        .set({
          accessStage,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))
        .returning({
          id: user.id,
          name: user.name,
          email: user.email,
          accessStage: user.accessStage,
        });

      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        success: true,
        user: updatedUser,
        message: `User access updated to ${accessStage}. Email invitation will be sent.`,
      };
    }),

  inviteExternalUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        accessStage: z.enum(['none', 'alpha', 'beta', 'production']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, accessStage } = input;

      const existingUser = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'User with this email already exists. Use the invite button for existing users.',
        });
      }

      const rawToken =
        crypto.randomUUID().replace(/-/g, '') +
        crypto.randomUUID().replace(/-/g, '');
      const tokenHash = await crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(rawToken))
        .then((b) => Buffer.from(new Uint8Array(b)).toString('hex'));

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      await ctx.db
        .insert(invite)
        .values({ email, accessStage, tokenHash, expiresAt });

      const baseUrl =
        env.BETTER_AUTH_URL?.replace(/\/$/, '') || 'https://bounty.new';
      const inviteUrl = `${baseUrl}/login?invite=${rawToken}`;
      await sendEmail({
        to: email,
        subject: 'You’re invited to bounty.new',
        from: FROM_ADDRESSES.notifications,
        react: ExternalInvite({
          inviteUrl,
          accessStage:
            accessStage === 'none'
              ? undefined
              : (accessStage as 'alpha' | 'beta' | 'production'),
        }),
      });

      return { success: true };
    }),

  applyInvite: protectedProcedure
    .input(z.object({ token: z.string().min(20) }))
    .mutation(async ({ ctx, input }) => {
      const { token } = input;
      const tokenHash = await crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(token))
        .then((b) => Buffer.from(new Uint8Array(b)).toString('hex'));

      const rows = await ctx.db
        .select()
        .from(invite)
        .where(eq(invite.tokenHash, tokenHash))
        .limit(1);
      const row = rows[0];
      if (!row)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invite' });
      if (row.usedAt)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invite already used',
        });
      if (row.expiresAt && row.expiresAt < new Date())
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite expired' });

      await ctx.db
        .update(user)
        .set({ accessStage: row.accessStage, updatedAt: new Date() })
        .where(eq(user.id, ctx.session.user.id));

      await ctx.db
        .update(invite)
        .set({ usedAt: new Date(), usedByUserId: ctx.session.user.id })
        .where(eq(invite.id, row.id));

      return { success: true };
    }),
});
