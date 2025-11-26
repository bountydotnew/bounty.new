import { TRPCError } from '@trpc/server';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, bountyDraft, waitlistEntry } from '@bounty/db';
import { FROM_ADDRESSES, OTPVerification, sendEmail } from '@bounty/email';
import { track } from '@bounty/track';
import { getRateLimiter } from '../lib/ratelimiter';
import { grim } from '../lib/use-dev-log';
import { publicProcedure, router } from '../trpc';

const { error, info } = grim();

// Helper to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate referral code
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const waitlistRouter = router({
  // Submit email + optional bounty data to join waitlist
  submit: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        githubIssueUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Rate limiting
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

        info('[waitlist.submit] Processing submission for:', input.email);

        // Check if already exists
        const [existing] = await db
          .select()
          .from(waitlistEntry)
          .where(eq(waitlistEntry.email, input.email))
          .limit(1);

        let entryId: string;

        if (existing) {
          entryId = existing.id;
          info('[waitlist.submit] Entry already exists:', entryId);
        } else {
          // Get current waitlist position
          const [{ count: currentCount }] = await db
            .select({ count: count() })
            .from(waitlistEntry);

          // Create new entry
          const [newEntry] = await db
            .insert(waitlistEntry)
            .values({
              email: input.email,
              position: currentCount + 1,
              referralCode: generateReferralCode(),
            })
            .returning();

          entryId = newEntry.id;
          info('[waitlist.submit] Created new entry:', entryId);
        }

        // Create or update bounty draft if data provided
        if (input.title || input.description || input.price) {
          const [existingDraft] = await db
            .select()
            .from(bountyDraft)
            .where(eq(bountyDraft.waitlistEntryId, entryId))
            .limit(1);

          if (existingDraft) {
            await db
              .update(bountyDraft)
              .set({
                title: input.title || existingDraft.title,
                description: input.description || existingDraft.description,
                price: input.price || existingDraft.price,
                githubIssueUrl: input.githubIssueUrl || existingDraft.githubIssueUrl,
                updatedAt: new Date(),
              })
              .where(eq(bountyDraft.id, existingDraft.id));
          } else {
            await db.insert(bountyDraft).values({
              waitlistEntryId: entryId,
              title: input.title,
              description: input.description,
              price: input.price,
              githubIssueUrl: input.githubIssueUrl,
            });
          }
        }

        // Generate and send OTP
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

        try {
          await track('waitlist_submitted', { source: 'api', hasBoountyData: !!(input.title || input.description || input.price) });
        } catch (trackError) {
          error('[waitlist.submit] Tracking error:', trackError);
        }

        info('[waitlist.submit] Successfully processed submission');
        return {
          success: true,
          entryId,
        };
      } catch (err) {
        error('[waitlist.submit] Error:', err);

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit to waitlist',
        });
      }
    }),

  // Verify OTP code
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

        // Check if already verified
        if (entry.emailVerified) {
          return {
            success: true,
            entryId: entry.id,
          };
        }

        // Check attempts
        if (entry.otpAttempts >= 5) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many failed attempts. Please request a new code.',
          });
        }

        // Check if OTP exists and is not expired
        if (!entry.otpCode || !entry.otpExpiresAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No verification code found. Please request a new code.',
          });
        }

        if (new Date() > entry.otpExpiresAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verification code expired. Please request a new code.',
          });
        }

        // Verify code
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
            message: 'Invalid verification code',
          });
        }

        // Mark as verified
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

        try {
          await track('waitlist_email_verified', { source: 'api' });
        } catch (trackError) {
          error('[waitlist.verifyOTP] Tracking error:', trackError);
        }

        info('[waitlist.verifyOTP] Successfully verified OTP');
        return {
          success: true,
          entryId: entry.id,
        };
      } catch (err) {
        error('[waitlist.verifyOTP] Error:', err);

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify code',
        });
      }
    }),

  // Resend OTP
  resendOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Rate limiting
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

        if (entry.emailVerified) {
          return { success: true };
        }

        // Generate new OTP
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

        info('[waitlist.resendOTP] Successfully resent OTP');
        return { success: true };
      } catch (err) {
        error('[waitlist.resendOTP] Error:', err);

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend verification code',
        });
      }
    }),

  // Complete onboarding (after GitHub OAuth)
  completeOnboarding: publicProcedure
    .input(
      z.object({
        entryId: z.string(),
        role: z.enum(['creator', 'developer']),
        githubId: z.string().optional(),
        githubUsername: z.string().optional(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        info('[waitlist.completeOnboarding] Completing onboarding for:', input.entryId);

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
            message: 'Email must be verified first',
          });
        }

        // Check username uniqueness if provided
        if (input.githubUsername) {
          const [existing] = await db
            .select()
            .from(waitlistEntry)
            .where(eq(waitlistEntry.username, input.githubUsername))
            .limit(1);

          if (existing && existing.id !== input.entryId) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Username already taken',
            });
          }
        }

        // Update entry with profile data
        await db
          .update(waitlistEntry)
          .set({
            role: input.role,
            githubId: input.githubId,
            githubUsername: input.githubUsername,
            username: input.githubUsername,
            name: input.name,
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(waitlistEntry.id, input.entryId));

        try {
          await track('waitlist_onboarding_completed', { source: 'api', role: input.role });
        } catch (trackError) {
          error('[waitlist.completeOnboarding] Tracking error:', trackError);
        }

        info('[waitlist.completeOnboarding] Successfully completed onboarding');
        return { success: true };
      } catch (err) {
        error('[waitlist.completeOnboarding] Error:', err);

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete onboarding',
        });
      }
    }),

  // Get entry data
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

        // Get bounty drafts
        const drafts = await db
          .select()
          .from(bountyDraft)
          .where(eq(bountyDraft.waitlistEntryId, input.entryId));

        return {
          entry,
          drafts,
        };
      } catch (err) {
        error('[waitlist.getEntry] Error:', err);

        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch entry data',
        });
      }
    }),
});
