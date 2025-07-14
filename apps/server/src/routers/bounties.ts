import { z } from "zod";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../lib/trpc";
import { db } from "../db";
import { bounty, submission, bountyApplication } from "../db/schema/bounties";

const createBountySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
  deliverables: z.string().min(10, "Deliverables must be at least 10 characters"),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, "Amount must be less than 10 trillion and have at most 2 decimal places"),
  currency: z.string().default("USD"),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional(),
  issueUrl: z.string().url().optional(),
});

const updateBountySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),
  requirements: z.string().min(10).optional(),
  deliverables: z.string().min(10).optional(),
  amount: z.string().regex(/^\d{1,13}(\.\d{1,2})?$/, "Amount must be less than 10 trillion and have at most 2 decimal places").optional(),
  currency: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  deadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  repositoryUrl: z.string().url().optional(),
  issueUrl: z.string().url().optional(),
  status: z.enum(["draft", "open", "in_progress", "completed", "cancelled"]).optional(),
});

const getBountiesSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z.enum(["draft", "open", "in_progress", "completed", "cancelled"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["created_at", "amount", "deadline", "title"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const submitApplicationSchema = z.object({
  bountyId: z.string().uuid(),
  message: z.string().min(10, "Application message must be at least 10 characters"),
});

const submitWorkSchema = z.object({
  bountyId: z.string().uuid(),
  description: z.string().min(10, "Submission description must be at least 10 characters"),
  deliverableUrl: z.string().url("Invalid deliverable URL"),
  pullRequestUrl: z.string().url().optional(),
});

export const bountiesRouter = router({
  create: protectedProcedure
    .input(createBountySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [newBounty] = await db
          .insert(bounty)
          .values({
            ...input,
            deadline: input.deadline ? new Date(input.deadline) : undefined,
            createdById: ctx.session.user.id,
          })
          .returning();

        return {
          success: true,
          data: newBounty,
          message: "Bounty created successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create bounty",
          cause: error,
        });
      }
    }),

  getAll: publicProcedure
    .input(getBountiesSchema)
    .query(async ({ input }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        
        const conditions = [];

        if (input.status) {
          conditions.push(eq(bounty.status, input.status));
        }

        if (input.difficulty) {
          conditions.push(eq(bounty.difficulty, input.difficulty));
        }

        if (input.search) {
          conditions.push(
            or(
              ilike(bounty.title, `%${input.search}%`),
              ilike(bounty.description, `%${input.search}%`)
            )
          );
        }

        if (input.tags && input.tags.length > 0) {
          conditions.push(sql`${bounty.tags} && ${input.tags}`);
        }

        const results = await db
          .select({
            id: bounty.id,
            title: bounty.title,
            description: bounty.description,
            amount: bounty.amount,
            currency: bounty.currency,
            status: bounty.status,
            difficulty: bounty.difficulty,
            deadline: bounty.deadline,
            tags: bounty.tags,
            repositoryUrl: bounty.repositoryUrl,
            createdAt: bounty.createdAt,
            updatedAt: bounty.updatedAt,
          })
          .from(bounty)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(input.sortOrder === "asc" ? bounty.createdAt : desc(bounty.createdAt))
          .limit(input.limit)
          .offset(offset);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bounty)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

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
          message: "Failed to fetch bounties",
          cause: error,
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const [result] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.id));

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bounty not found",
          });
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch bounty",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(updateBountySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, id));

        if (!existingBounty) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bounty not found",
          });
        }

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own bounties",
          });
        }

        const [updatedBounty] = await db
          .update(bounty)
          .set({
            ...updateData,
            deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
            updatedAt: new Date(),
          })
          .where(eq(bounty.id, id))
          .returning();

        return {
          success: true,
          data: updatedBounty,
          message: "Bounty updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update bounty",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.id));

        if (!existingBounty) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bounty not found",
          });
        }

        if (existingBounty.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own bounties",
          });
        }

        await db.delete(bounty).where(eq(bounty.id, input.id));

        return {
          success: true,
          message: "Bounty deleted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete bounty",
          cause: error,
        });
      }
    }),

  applyToBounty: protectedProcedure
    .input(submitApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId));

        if (!existingBounty) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bounty not found",
          });
        }

        if (existingBounty.status !== "open") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot apply to a bounty that is not open",
          });
        }

        const [existingApplication] = await db
          .select()
          .from(bountyApplication)
          .where(
            and(
              eq(bountyApplication.bountyId, input.bountyId),
              eq(bountyApplication.applicantId, ctx.session.user.id)
            )
          );

        if (existingApplication) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already applied to this bounty",
          });
        }

        const [newApplication] = await db
          .insert(bountyApplication)
          .values({
            ...input,
            applicantId: ctx.session.user.id,
          })
          .returning();

        return {
          success: true,
          data: newApplication,
          message: "Application submitted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit application",
          cause: error,
        });
      }
    }),

  submitWork: protectedProcedure
    .input(submitWorkSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [existingBounty] = await db
          .select()
          .from(bounty)
          .where(eq(bounty.id, input.bountyId));

        if (!existingBounty) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Bounty not found",
          });
        }

        if (existingBounty.assignedToId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this bounty",
          });
        }

        const [newSubmission] = await db
          .insert(submission)
          .values({
            ...input,
            contributorId: ctx.session.user.id,
          })
          .returning();

        await db
          .update(bounty)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(bounty.id, input.bountyId));

        return {
          success: true,
          data: newSubmission,
          message: "Work submitted successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit work",
          cause: error,
        });
      }
    }),

  getMyBounties: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
      status: z.enum(["draft", "open", "in_progress", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        
        const conditions = [eq(bounty.createdById, ctx.session.user.id)];

        if (input.status) {
          conditions.push(eq(bounty.status, input.status));
        }

        const results = await db
          .select()
          .from(bounty)
          .where(and(...conditions))
          .orderBy(desc(bounty.createdAt))
          .limit(input.limit)
          .offset(offset);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bounty)
          .where(eq(bounty.createdById, ctx.session.user.id));

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
          message: "Failed to fetch your bounties",
          cause: error,
        });
      }
    }),
}); 