import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db, userProfile, userReputation, userRating, user } from "@bounty/db";

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  githubUsername: z.string().max(50).optional(),
  twitterUsername: z.string().max(50).optional(),
  linkedinUrl: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  hourlyRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  currency: z.string().default("USD").optional(),
  timezone: z.string().optional(),
  availableForWork: z.boolean().optional(),
});

const rateUserSchema = z.object({
  ratedUserId: z.string().uuid(),
  bountyId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const profilesRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const [profile] = await db
          .select({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              createdAt: user.createdAt,
            },
            profile: userProfile,
            reputation: userReputation,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .leftJoin(userReputation, eq(user.id, userReputation.userId))
          .where(eq(user.id, input.userId));

        if (!profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        return {
          success: true,
          data: profile,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch profile",
          cause: error,
        });
      }
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const [profile] = await db
        .select({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: user.createdAt,
          },
          profile: userProfile,
          reputation: userReputation,
        })
        .from(user)
        .leftJoin(userProfile, eq(user.id, userProfile.userId))
        .leftJoin(userReputation, eq(user.id, userReputation.userId))
        .where(eq(user.id, ctx.session.user.id));

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch your profile",
        cause: error,
      });
    }
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingProfile] = await db
          .select()
          .from(userProfile)
          .where(eq(userProfile.userId, ctx.session.user.id));

        let updatedProfile;

        if (existingProfile) {
          [updatedProfile] = await db
            .update(userProfile)
            .set({
              ...input,
              updatedAt: new Date(),
            })
            .where(eq(userProfile.userId, ctx.session.user.id))
            .returning();
        } else {
          [updatedProfile] = await db
            .insert(userProfile)
            .values({
              ...input,
              userId: ctx.session.user.id,
            })
            .returning();
        }

        const [existingReputation] = await db
          .select()
          .from(userReputation)
          .where(eq(userReputation.userId, ctx.session.user.id));

        if (!existingReputation) {
          await db.insert(userReputation).values({
            userId: ctx.session.user.id,
          });
        }

        return {
          success: true,
          data: updatedProfile,
          message: "Profile updated successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
          cause: error,
        });
      }
    }),

  getTopContributors: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(50).default(10),
        sortBy: z
          .enum(["totalEarned", "bountiesCompleted", "averageRating"])
          .default("totalEarned"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const results = await db
          .select({
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
            profile: userProfile,
            reputation: userReputation,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .leftJoin(userReputation, eq(user.id, userReputation.userId))
          .where(sql`${userReputation.bountiesCompleted} > 0`)
          .orderBy(desc(userReputation[input.sortBy]))
          .limit(input.limit);

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch top contributors",
          cause: error,
        });
      }
    }),

  rateUser: protectedProcedure
    .input(rateUserSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.ratedUserId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot rate yourself",
          });
        }

        const [existingRating] = await db
          .select()
          .from(userRating)
          .where(
            sql`${userRating.ratedUserId} = ${input.ratedUserId} AND ${userRating.raterUserId} = ${ctx.session.user.id} AND ${userRating.bountyId} = ${input.bountyId}`,
          );

        if (existingRating) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already rated this user for this bounty",
          });
        }

        const [newRating] = await db
          .insert(userRating)
          .values({
            ...input,
            raterUserId: ctx.session.user.id,
          })
          .returning();

        const [{ averageRating, totalRatings }] = await db
          .select({
            averageRating: sql<number>`AVG(${userRating.rating})`,
            totalRatings: sql<number>`COUNT(*)`,
          })
          .from(userRating)
          .where(eq(userRating.ratedUserId, input.ratedUserId));

        await db
          .update(userReputation)
          .set({
            averageRating: averageRating.toString(),
            totalRatings: totalRatings,
            updatedAt: new Date(),
          })
          .where(eq(userReputation.userId, input.ratedUserId));

        return {
          success: true,
          data: newRating,
          message: "Rating submitted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit rating",
          cause: error,
        });
      }
    }),

  getUserRatings: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        const results = await db
          .select({
            rating: userRating,
            rater: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
          })
          .from(userRating)
          .leftJoin(user, eq(userRating.raterUserId, user.id))
          .where(eq(userRating.ratedUserId, input.userId))
          .orderBy(desc(userRating.createdAt))
          .limit(input.limit)
          .offset(offset);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(userRating)
          .where(eq(userRating.ratedUserId, input.userId));

        return {
          success: true,
          data: results,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: count,
            totalPages: Math.ceil(count / input.limit),
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user ratings",
          cause: error,
        });
      }
    }),

  searchProfiles: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        skills: z.array(z.string()).optional(),
        availableForWork: z.boolean().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          sql`${user.name} ILIKE ${"%" + input.query + "%"} OR ${userProfile.bio} ILIKE ${"%" + input.query + "%"}`,
        ];

        if (input.skills && input.skills.length > 0) {
          conditions.push(sql`${userProfile.skills} && ${input.skills}`);
        }

        if (input.availableForWork !== undefined) {
          conditions.push(
            eq(userProfile.availableForWork, input.availableForWork),
          );
        }

        const results = await db
          .select({
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
            },
            profile: userProfile,
            reputation: userReputation,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .leftJoin(userReputation, eq(user.id, userReputation.userId))
          .where(sql`${conditions.join(" AND ")}`)
          .orderBy(desc(userReputation.averageRating))
          .limit(input.limit)
          .offset(offset);

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search profiles",
          cause: error,
        });
      }
    }),
});
