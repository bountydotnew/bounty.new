import { bountyDraft, db, waitlistEntry } from '@bounty/db';
import { FROM_ADDRESSES, OTPVerification, sendEmail } from '@bounty/email';
import { TRPCError } from '@trpc/server';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getRateLimiter } from '../lib/ratelimiter';
import { grim } from '../lib/use-dev-log';
import { publicProcedure, router } from '../trpc';

const { error, info } = grim();

// Helper function to generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate an 8-character referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
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
        price: z.number().int().positive().optional(), // in cents
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

        info('[waitlist.submit] Processing email:', input.email);

        // Check if entry already exists
        const existing = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.email, input.email))
          .limit(1);

        let entryId: string;

        if (existing[0]) {
          entryId = existing[0].id;

          // Update existing entry with new OTP
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
            react: OTPVerification({
              code: otpCode,
              email: input.email,
              type: 'email-verification',
            }),
          });

          info('[waitlist.submit] Updated existing entry and sent OTP');
        } else {
          // Get current waitlist count for position
          const [{ value: currentCount }] = await db
            .select({ value: count() })
            .from(waitlistEntry);

          // Create new entry
          const otpCode = generateOTP();
          const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
          const referralCode = generateReferralCode();

          const [newEntry] = await db
            .insert(waitlistEntry)
            .values({
              email: input.email,
              otpCode,
              otpExpiresAt,
              position: currentCount + 1,
              referralCode,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          entryId = newEntry.id;

          // Create bounty draft if any bounty data is provided
          if (input.title || input.description || input.price || input.githubIssueUrl) {
            await db.insert(bountyDraft).values({
              waitlistEntryId: entryId,
              title: input.title,
              description: input.description,
              price: input.price,
              githubIssueUrl: input.githubIssueUrl,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          // Send OTP email
          await sendEmail({
            to: input.email,
            subject: `Your verification code: ${otpCode}`,
            from: FROM_ADDRESSES.notifications,
            react: OTPVerification({
              code: otpCode,
              email: input.email,
              type: 'email-verification',
            }),
          });

          info('[waitlist.submit] Created new entry with bounty draft');
        }

        return {
          success: true,
          entryId,
        };
      } catch (err) {
        error('[waitlist.submit] Error:', err);
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
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        info('[waitlist.verifyOTP] Verifying OTP for:', input.email);

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

        // Check attempts
        if (entry.otpAttempts >= 5) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many failed attempts. Please request a new code.',
          });
        }

        // Check expiry
        if (!entry.otpExpiresAt || entry.otpExpiresAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'OTP has expired. Please request a new code.',
          });
        }

        // Verify code
        if (entry.otpCode !== input.code) {
          await db
            .update(waitlistEntry)
            .set({
              otpAttempts: entry.otpAttempts + 1,
              updatedAt: new Date(),
            })
            .where(eq(waitlistEntry.id, entry.id));

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid verification code',
          });
        }

        // Mark email as verified
        await db
          .update(waitlistEntry)
          .set({
            emailVerified: true,
            otpCode: null,
            otpExpiresAt: null,
            otpAttempts: 0,
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, entry.id));

        info('[waitlist.verifyOTP] Successfully verified OTP');

        return {
          success: true,
          entryId: entry.id,
        };
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
        info('[waitlist.resendOTP] Resending OTP for:', input.email);

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

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db
          .update(waitlistEntry)
          .set({
            otpCode,
            otpExpiresAt,
            otpAttempts: 0,
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, entry.id));

        await sendEmail({
          to: input.email,
          subject: `Your verification code: ${otpCode}`,
          from: FROM_ADDRESSES.notifications,
          react: OTPVerification({
            code: otpCode,
            email: input.email,
            type: 'email-verification',
          }),
        });

        info('[waitlist.resendOTP] Successfully resent OTP');

        return {
          success: true,
        };
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
        name: z.string().optional(),
        username: z.string().min(3).max(20).optional(),
        role: z.enum(['creator', 'developer']),
        githubId: z.string().optional(),
        githubUsername: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        info('[waitlist.completeOnboarding] Completing onboarding for:', input.entryId);

        // Check if username is already taken
        if (input.username) {
          const existing = await db
            .select()
            .from(waitlistEntry)
            .where(eq(waitlistEntry.username, input.username))
            .limit(1);

          if (existing[0] && existing[0].id !== input.entryId) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Username already taken',
            });
          }
        }

        await db
          .update(waitlistEntry)
          .set({
            name: input.name,
            username: input.username,
            role: input.role,
            githubId: input.githubId,
            githubUsername: input.githubUsername,
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, input.entryId));

        info('[waitlist.completeOnboarding] Successfully completed onboarding');

        return {
          success: true,
        };
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
        info('[waitlist.getEntry] Fetching entry:', input.entryId);

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
          .where(eq(bountyDraft.waitlistEntryId, entry.id))
          .orderBy(desc(bountyDraft.createdAt));

        return {
          entry,
          bountyDrafts: drafts,
        };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        error('[waitlist.getEntry] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch entry',
        });
      }
    }),
});
