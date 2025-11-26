import {
  bountyDraft,
  db,
  waitlistEntry,
} from '@bounty/db';
import { FROM_ADDRESSES, OTPVerification, sendEmail } from '@bounty/email';
import { TRPCError } from '@trpc/server';
import { count, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { getRateLimiter } from '../lib/ratelimiter';
import { grim } from '../lib/use-dev-log';

const { error, info } = grim();

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const waitlistRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().int().positive().optional(),
        githubIssueUrl: z.string().url().optional(),
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

        // Check if email already exists
        const existingEntry = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.email, input.email))
          .limit(1);

        let entryId: string;

        if (existingEntry.length > 0) {
          // Update existing entry
          entryId = existingEntry[0].id;

          // Generate new OTP
          const otpCode = generateOTP();
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await db
            .update(waitlistEntry)
            .set({
              otpCode,
              otpExpiresAt,
              otpAttempts: 0,
              updatedAt: new Date(),
            })
            .where(eq(waitlistEntry.id, entryId));

          // Send OTP email
          await sendEmail({
            to: input.email,
            subject: `Your verification code: ${otpCode}`,
            from: FROM_ADDRESSES.notifications,
            react: OTPVerification({ code: otpCode, email: input.email }),
          });

          return { success: true, entryId };
        }

        // Get current waitlist count for position
        const waitlistCount = await db
          .select({ count: count() })
          .from(waitlistEntry);
        const position = (waitlistCount[0]?.count ?? 0) + 1;

        // Generate OTP and referral code
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        let referralCode = generateReferralCode();

        // Ensure referral code is unique
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          const existing = await db
            .select()
            .from(waitlistEntry)
            .where(eq(waitlistEntry.referralCode, referralCode))
            .limit(1);

          if (existing.length === 0) {
            isUnique = true;
          } else {
            referralCode = generateReferralCode();
            attempts++;
          }
        }

        // Create waitlist entry
        const [newEntry] = await db
          .insert(waitlistEntry)
          .values({
            email: input.email,
            otpCode,
            otpExpiresAt,
            position,
            referralCode,
          })
          .returning();

        entryId = newEntry.id;

        // Create bounty draft if any bounty data provided
        if (input.title || input.description || input.price || input.githubIssueUrl) {
          await db.insert(bountyDraft).values({
            waitlistEntryId: entryId,
            title: input.title,
            description: input.description,
            price: input.price,
            githubIssueUrl: input.githubIssueUrl,
          });
        }

        // Send OTP email
        await sendEmail({
          to: input.email,
          subject: `Your verification code: ${otpCode}`,
          from: FROM_ADDRESSES.notifications,
          react: OTPVerification({ code: otpCode, email: input.email }),
        });

        info('[waitlist.submit] Successfully created entry:', entryId);

        return { success: true, entryId };
      } catch (err) {
        error('[waitlist.submit] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit to waitlist',
        });
      }
    }),

  verifyOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [entry] = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.email, input.email))
          .limit(1);

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        if (entry.emailVerified) {
          return { success: true, entryId: entry.id };
        }

        if (!entry.otpCode || !entry.otpExpiresAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No OTP code found',
          });
        }

        if (entry.otpAttempts >= 5) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many attempts. Please request a new code.',
          });
        }

        if (new Date() > entry.otpExpiresAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OTP code has expired',
          });
        }

        if (entry.otpCode !== input.code) {
          // Increment attempts
          await db
            .update(waitlistEntry)
            .set({
              otpAttempts: entry.otpAttempts + 1,
              updatedAt: new Date(),
            })
            .where(eq(waitlistEntry.id, entry.id));

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid code. Please try again.',
          });
        }

        // Mark email as verified
        await db
          .update(waitlistEntry)
          .set({
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, entry.id));

        info('[waitlist.verifyOTP] Successfully verified:', entry.id);

        return { success: true, entryId: entry.id };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        error('[waitlist.verifyOTP] Error:', err);
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
        const [entry] = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.email, input.email))
          .limit(1);

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        if (entry.emailVerified) {
          return { success: true };
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db
          .update(waitlistEntry)
          .set({
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, entry.id));

        // Send OTP email
        await sendEmail({
          to: input.email,
          subject: `Your verification code: ${otpCode}`,
          from: FROM_ADDRESSES.notifications,
          react: OTPVerification({ code: otpCode, email: input.email }),
        });

        info('[waitlist.resendOTP] Successfully resent OTP:', entry.id);

        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        error('[waitlist.resendOTP] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend OTP',
        });
      }
    }),

  completeOnboarding: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        role: z.enum(['creator', 'developer']),
        githubId: z.string().optional(),
        githubUsername: z.string().optional(),
        githubEmail: z.string().optional(),
        name: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [entry] = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.id, input.entryId))
          .limit(1);

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        if (!entry.emailVerified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email not verified',
          });
        }

        // Check username uniqueness if provided
        if (input.username) {
          const existingUsername = await db
            .select()
            .from(waitlistEntry)
            .where(
              sql`${waitlistEntry.username} = ${input.username} AND ${waitlistEntry.id} != ${input.entryId}`
            )
            .limit(1);

          if (existingUsername.length > 0) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Username already taken',
            });
          }
        }

        // Update waitlist entry
        await db
          .update(waitlistEntry)
          .set({
            role: input.role,
            githubId: input.githubId,
            githubUsername: input.githubUsername,
            githubEmail: input.githubEmail,
            name: input.name,
            username: input.username,
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, input.entryId));

        info('[waitlist.completeOnboarding] Successfully completed:', input.entryId);

        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        error('[waitlist.completeOnboarding] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete onboarding',
        });
      }
    }),

  getEntry: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const [entry] = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.id, input.entryId))
          .limit(1);

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        const drafts = await db
          .select()
          .from(bountyDraft)
          .where(eq(bountyDraft.waitlistEntryId, input.entryId));

        return {
          success: true,
          data: {
            entry,
            bountyDrafts: drafts,
          },
        };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        error('[waitlist.getEntry] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get entry',
        });
      }
    }),
});
