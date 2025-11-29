import { track } from '@bounty/track';
import { TRPCError } from '@trpc/server';
import { eq, lt } from 'drizzle-orm';
import { z } from 'zod';

const info = console.info.bind(console);
const error = console.error.bind(console);
const warn = console.warn.bind(console);

// Generate 6-digit OTP code
const generateOTP = (): string => {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
};

import { db, user as userTable, waitlist, bounty } from '@bounty/db';
import {
  AlphaAccessGranted,
  FROM_ADDRESSES,
  sendEmail,
  OTPVerification,
} from '@bounty/email';
import { getRateLimiter } from '../lib/ratelimiter';
import {
  adminProcedure,
  publicProcedure,
  protectedProcedure,
  router,
} from '../trpc';
import { env } from '@bounty/env/server';

export const earlyAccessRouter = router({
  getWaitlistCount: publicProcedure.query(async () => {
    try {
      info('[getWaitlistCount] called');
      const allEntries = await db.query.waitlist.findMany();
      const count = allEntries.length;
      info('[getWaitlistCount] db result:', count);

      return {
        count,
      };
    } catch (err) {
      error('[getWaitlistCount] Error:', err);

      // Provide more specific error messages
      if (err instanceof TRPCError) {
        throw err;
      }

      // Database connection errors
      if (err instanceof Error) {
        if (
          err.message.includes('connect') ||
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('timeout')
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed - please try again later',
          });
        }

        if (
          err.message.includes('does not exist') ||
          err.message.includes('relation')
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database table not found - migrations may not be applied',
          });
        }
      }

      // Return a default count instead of throwing an error
      warn('[getWaitlistCount] Returning default count due to error:', err);
      return {
        count: 0,
      };
    }
  }),
  // Simplified endpoint for adding emails to waitlist (rate limiting handled by web app)
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const limiter = getRateLimiter('waitlist');
        if (limiter) {
          const safeIp =
            ctx.clientIP ||
            `anonymous-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { success } = await limiter.limit(safeIp);

          if (!success) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many requests. Please try again later.',
            });
          }
        }
        info('[addToWaitlist] Processing email:', input.email);

        const userAlreadyInWaitlist = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.email, input.email),
        });

        if (userAlreadyInWaitlist) {
          return { message: "You're already on the waitlist!" };
        }

        await db.insert(waitlist).values({
          email: input.email,
          createdAt: new Date(),
        });

        try {
          await track('waitlist_joined', { source: 'api' });
        } catch {}

        info(
          '[addToWaitlist] Successfully added email to waitlist:',
          input.email
        );
        return { message: "You've been added to the waitlist!" };
      } catch (error: unknown) {
        warn('[addToWaitlist] Error:', error);

        if (
          error instanceof Error &&
          error.message.includes('unique constraint')
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists in waitlist',
          });
        }

        if (
          error instanceof Error &&
          error.message.includes('violates not-null constraint')
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid email format',
          });
        }

        if (
          error instanceof Error &&
          (error.message.includes('connect') ||
            error.message.includes('ECONNREFUSED'))
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        if (
          error instanceof Error &&
          (error.message.includes('does not exist') ||
            error.message.includes('relation'))
        ) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database table not found - migrations may not be applied',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to join waitlist',
        });
      }
    }),

  getAdminWaitlist: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { page, limit, search } = input;
        const offset = (page - 1) * limit;

        let entries;
        if (search) {
          entries = await db.query.waitlist.findMany({
            where: (fields, { eq }) => eq(fields.email, search),
            limit,
            offset,
          });
        } else {
          entries = await db.query.waitlist.findMany({
            limit,
            offset,
          });
        }

        const allEntries = await db.query.waitlist.findMany();
        const total = allEntries.length;

        const entriesWithAccess = await db.query.waitlist.findMany({
          where: (fields, { eq }) => eq(fields.hasAccess, true),
        });
        const totalWithAccess = entriesWithAccess.length;

        return {
          entries,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          stats: {
            total,
            withAccess: totalWithAccess,
            pending: total - totalWithAccess,
          },
        };
      } catch (err) {
        error('[getAdminWaitlist] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch waitlist data',
        });
      }
    }),

  updateWaitlistAccess: adminProcedure
    .input(
      z.object({
        id: z.string(),
        hasAccess: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, hasAccess } = input;

        await db
          .update(waitlist)
          .set({ hasAccess })
          .where(eq(waitlist.id as any, id) as any);

        info(
          '[updateWaitlistAccess] Updated access for ID:',
          id,
          'hasAccess:',
          hasAccess
        );

        if (hasAccess) {
          const entry = await db.query.waitlist.findFirst({
            where: (fields, { eq }) => eq(fields.id, id),
          });
          if (entry?.email) {
            const u = await db.query.user.findFirst({
              columns: {
                id: true,
                name: true,
                email: true,
              },
              where: (fields, { eq }) => eq(fields.email, entry.email),
            });
            const to = u?.email ?? entry.email;
            await sendEmail({
              to,
              subject: 'Alpha access granted',
              from: FROM_ADDRESSES.notifications,
              react: AlphaAccessGranted({ name: u?.name ?? '' }),
            });
          }
        }
        return { success: true };
      } catch (err) {
        error('[updateWaitlistAccess] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update waitlist access',
        });
      }
    }),

  inviteToBeta: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, input.id),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        const u = await db.query.user.findFirst({
          columns: {
            id: true,
            name: true,
            email: true,
          },
          where: (fields, { eq }) => eq(fields.email, entry.email),
        });

        if (!u?.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found for this email',
          });
        }

        await db
          .update(userTable)
          .set({
            betaAccessStatus: 'approved',
            updatedAt: new Date(),
          })
          .where(eq(userTable.id as any, u.id) as any);

        await sendEmail({
          to: u.email,
          subject: 'Alpha access granted',
          from: FROM_ADDRESSES.notifications,
          react: AlphaAccessGranted({ name: u.name ?? '' }),
        });

        return { success: true };
      } catch (err) {
        error('[inviteToBeta] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite to beta',
        });
      }
    }),

  submitWithBounty: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        bountyTitle: z.string().optional(),
        bountyDescription: z.string().optional(),
        bountyAmount: z.string().optional(),
        bountyDifficulty: z
          .enum(['beginner', 'intermediate', 'advanced', 'expert'])
          .optional(),
        bountyGithubIssueUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const limiter = getRateLimiter('waitlist');
        if (limiter) {
          const safeIp =
            ctx.clientIP ||
            `anonymous-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { success } = await limiter.limit(safeIp);

          if (!success) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many requests. Please try again later.',
            });
          }
        }

        info('[submitWithBounty] Processing email:', input.email);

        // Check if entry exists
        const existingEntry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.email, input.email),
        });

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let entryId: string;
        let position: number;

        if (existingEntry) {
          // Update existing entry
          entryId = existingEntry.id;

          // Get position before update
          const allEntries = await db.query.waitlist.findMany({
            where: (fields, { lt }) => lt(fields.createdAt, existingEntry.createdAt),
          });
          position = allEntries.length + 1;

          await db
            .update(waitlist)
            .set({
              otpCode,
              otpExpiresAt,
              otpAttempts: 0,
              bountyTitle: input.bountyTitle ?? existingEntry.bountyTitle,
              bountyDescription:
                input.bountyDescription ?? existingEntry.bountyDescription,
              bountyAmount: input.bountyAmount ?? existingEntry.bountyAmount,
              bountyDifficulty:
                input.bountyDifficulty ?? existingEntry.bountyDifficulty,
              bountyGithubIssueUrl:
                input.bountyGithubIssueUrl ??
                existingEntry.bountyGithubIssueUrl,
              position,
            })
            .where(eq(waitlist.id as any, entryId) as any);
        } else {
          // Create new entry
          // Get position (count of existing entries)
          const allEntries = await db.query.waitlist.findMany();
          position = allEntries.length + 1;

          const [newEntry] = await db
            .insert(waitlist)
            .values({
              email: input.email,
              otpCode,
              otpExpiresAt,
              otpAttempts: 0,
              emailVerified: false,
              bountyTitle: input.bountyTitle,
              bountyDescription: input.bountyDescription,
              bountyAmount: input.bountyAmount,
              bountyDifficulty: input.bountyDifficulty,
              bountyGithubIssueUrl: input.bountyGithubIssueUrl,
              position,
              createdAt: new Date(),
            })
            .returning({ id: waitlist.id });

          if (!newEntry) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create waitlist entry',
            });
          }

          entryId = newEntry.id;
        }

        // Send OTP email
        try {
          await sendEmail({
            to: input.email,
            subject: `Your verification code: ${otpCode}`,
            from: FROM_ADDRESSES.notifications,
            react: OTPVerification({
              code: otpCode,
              entryId,
              email: input.email,
            }),
          });
        } catch (emailError) {
          warn('[submitWithBounty] Failed to send email:', emailError);
          // Don't fail the request if email fails
        }

        try {
          await track('waitlist_joined', { source: 'api' });
        } catch {}

        info('[submitWithBounty] Successfully processed:', input.email);
        return { success: true, entryId, position };
      } catch (error: unknown) {
        warn('[submitWithBounty] Error:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit waitlist entry',
        });
      }
    }),

  verifyOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6, 'OTP code must be 6 digits'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.email, input.email),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        // Check if OTP attempts exceeded
        if (entry.otpAttempts >= 5) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message:
              'Too many verification attempts. Please request a new code.',
          });
        }

        // Check if OTP expired
        if (!entry.otpExpiresAt || entry.otpExpiresAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OTP code has expired. Please request a new one.',
          });
        }

        // Verify OTP
        if (entry.otpCode !== input.code) {
          await db
            .update(waitlist)
            .set({ otpAttempts: (entry.otpAttempts ?? 0) + 1 })
            .where(eq(waitlist.id as any, entry.id) as any);

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid OTP code',
          });
        }

        // Mark email as verified
        await db
          .update(waitlist)
          .set({ emailVerified: true, otpAttempts: 0 })
          .where(eq(waitlist.id as any, entry.id) as any);

        info('[verifyOTP] Email verified:', input.email);
        return { success: true, entryId: entry.id };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[verifyOTP] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify OTP',
        });
      }
    }),

  resendOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.email, input.email),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db
          .update(waitlist)
          .set({
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
          })
          .where(eq(waitlist.id as any, entry.id) as any);

        // Send OTP email
        try {
          await sendEmail({
            to: input.email,
            subject: `Your verification code: ${otpCode}`,
            from: FROM_ADDRESSES.notifications,
            react: OTPVerification({
              code: otpCode,
              entryId: entry.id,
              email: input.email,
            }),
          });
        } catch (emailError) {
          warn('[resendOTP] Failed to send email:', emailError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send verification email',
          });
        }

        info('[resendOTP] OTP resent:', input.email);
        return { success: true };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[resendOTP] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend OTP',
        });
      }
    }),

  getWaitlistEntry: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, input.entryId),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        return {
          success: true,
          data: {
            id: entry.id,
            email: entry.email,
            emailVerified: entry.emailVerified,
            position: entry.position,
            bountyTitle: entry.bountyTitle,
            bountyDescription: entry.bountyDescription,
            bountyAmount: entry.bountyAmount,
            bountyDifficulty: entry.bountyDifficulty,
            bountyGithubIssueUrl: entry.bountyGithubIssueUrl,
            userId: entry.userId,
            createdAt: entry.createdAt,
          },
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[getWaitlistEntry] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch waitlist entry',
        });
      }
    }),

  // Get waitlist entry for the authenticated user
  getMyWaitlistEntry: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      // First try to find by userId
      let entry = await db.query.waitlist.findFirst({
        where: (fields, { eq }) => eq(fields.userId, userId),
      });

      // If not found by userId, try by email and auto-link
      if (!entry && userEmail) {
        entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.email, userEmail),
        });

        // If found by email, link it to this user
        if (entry && !entry.userId) {
          await db
            .update(waitlist)
            .set({ userId })
            .where(eq(waitlist.id as any, entry.id) as any);

          info('[getMyWaitlistEntry] Auto-linked entry by email:', userEmail);
        }
      }

      if (!entry) {
        return null;
      }

      return {
        id: entry.id,
        email: entry.email,
        emailVerified: entry.emailVerified,
        position: entry.position,
        bountyTitle: entry.bountyTitle,
        bountyDescription: entry.bountyDescription,
        bountyAmount: entry.bountyAmount,
        createdAt: entry.createdAt,
      };
    } catch (error: unknown) {
      if (error instanceof TRPCError) {
        throw error;
      }

      warn('[getMyWaitlistEntry] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch waitlist entry',
      });
    }
  }),

  linkUserToWaitlist: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;

        // Find waitlist entry by ID (more reliable than email matching)
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, input.entryId),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        if (entry.userId === userId) {
          // Already linked to this user
          return {
            success: true,
            entryId: entry.id,
            position: entry.position,
            bountyId: null,
          };
        }

        if (entry.userId) {
          // Already linked to a different user
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This waitlist entry is already linked to another account',
          });
        }

        // Check if this GitHub account is already linked to another waitlist entry
        const existingLink = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.userId, userId),
        });

        if (existingLink) {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'Your GitHub account is already linked to another waitlist entry. Please disconnect it first.',
          });
        }

        // Update entry with userId
        await db
          .update(waitlist)
          .set({ userId })
          .where(eq(waitlist.id as any, entry.id) as any);

        // Create real bounty from draft if draft data exists
        let bountyId: string | null = null;
        if (entry.bountyTitle && entry.bountyAmount) {
          try {
            const [newBounty] = await db
              .insert(bounty)
              .values({
                title: entry.bountyTitle,
                description: entry.bountyDescription ?? '',
                amount: entry.bountyAmount,
                currency: 'USD',
                difficulty:
                  (entry.bountyDifficulty as
                    | 'beginner'
                    | 'intermediate'
                    | 'advanced'
                    | 'expert') ?? 'intermediate',
                status: 'draft',
                issueUrl: entry.bountyGithubIssueUrl ?? undefined,
                createdById: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning({ id: bounty.id });

            if (newBounty) {
              bountyId = newBounty.id;
            }
          } catch (bountyError) {
            warn('[linkUserToWaitlist] Failed to create bounty:', bountyError);
            // Don't fail the whole operation if bounty creation fails
          }
        }

        info(
          '[linkUserToWaitlist] User linked:',
          userId,
          'to entry:',
          entry.id
        );
        return {
          success: true,
          entryId: entry.id,
          position: entry.position,
          bountyId,
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[linkUserToWaitlist] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to link user to waitlist',
        });
      }
    }),

  unlinkGithub: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;

        // Find waitlist entry
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, input.entryId),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        // If already unlinked, just return success
        if (!entry.userId) {
          info('[unlinkGithub] Entry already unlinked:', entry.id);
          return {
            success: true,
            entryId: entry.id,
          };
        }

        // Verify this user owns this entry
        if (entry.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only disconnect your own account',
          });
        }

        // Clear the userId from the waitlist entry
        await db
          .update(waitlist)
          .set({ userId: null })
          .where(eq(waitlist.id as any, entry.id) as any);

        info('[unlinkGithub] User unlinked:', userId, 'from entry:', entry.id);
        return {
          success: true,
          entryId: entry.id,
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[unlinkGithub] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to disconnect GitHub',
        });
      }
    }),

  updateBountyDraft: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        bountyTitle: z.string().optional(),
        bountyDescription: z.string().optional(),
        bountyAmount: z.string().optional(),
        bountyDifficulty: z
          .enum(['beginner', 'intermediate', 'advanced', 'expert'])
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { entryId, ...bountyData } = input;

        // Find entry first
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, entryId),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        // Update bounty draft fields
        await db
          .update(waitlist)
          .set({
            bountyTitle: bountyData.bountyTitle ?? entry.bountyTitle,
            bountyDescription:
              bountyData.bountyDescription ?? entry.bountyDescription,
            bountyAmount: bountyData.bountyAmount ?? entry.bountyAmount,
            bountyDifficulty:
              bountyData.bountyDifficulty ?? entry.bountyDifficulty,
          })
          .where(eq(waitlist.id as any, entryId) as any);

        info('[updateBountyDraft] Updated draft for entry:', entryId);

        return {
          success: true,
          entryId,
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) {
          throw error;
        }

        warn('[updateBountyDraft] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update bounty draft',
        });
      }
    }),
});
