import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql } from "drizzle-orm";

import { db, user, session, userProfile, userReputation } from "@bounty/db";
import { protectedProcedure, publicProcedure, router, adminProcedure } from "../trpc";

export const userRouter = router({
  hasAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userRecord = await db.select({ hasAccess: user.hasAccess }).from(user).where(eq(user.id, userId)).limit(1);

    if (!userRecord[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
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
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        success: true,
        data: userRecord,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch current user",
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
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user sessions",
        cause: error,
      });
    }
  }),

  revokeSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(async ({ ctx, input }) => {
    try {
      const [sessionToRevoke] = await db.select().from(session).where(eq(session.id, input.sessionId));

      if (!sessionToRevoke) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (sessionToRevoke.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only revoke your own sessions",
        });
      }

      await db.delete(session).where(eq(session.id, input.sessionId));

      return {
        success: true,
        message: "Session revoked successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to revoke session",
        cause: error,
      });
    }
  }),

  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [stats] = await db
        .select({
          totalUsers: sql<number>`count(*)`,
        })
        .from(user);

      const [userRep] = await db.select().from(userReputation).where(eq(userReputation.userId, ctx.session.user.id));

      return {
        success: true,
        data: {
          platformStats: {
            totalUsers: stats.totalUsers,
          },
          userStats: userRep || {
            totalEarned: "0.00",
            bountiesCompleted: 0,
            bountiesCreated: 0,
            averageRating: "0.00",
            totalRatings: 0,
            successRate: "0.00",
            completionRate: "0.00",
          },
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user stats",
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
        const currentUser = await db.select().from(user).where(eq(user.id, ctx.session.user.id)).limit(1);

        if (!currentUser[0]?.hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
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
          message: "User access updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user access",
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
        code: "NOT_FOUND",
        message: "User not found",
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

      let whereClause = undefined;
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
    .input(z.object({
      userId: z.string(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      await ctx.db
        .update(user)
        .set({ role })
        .where(eq(user.id, userId));

      return { success: true };
    }),
});
