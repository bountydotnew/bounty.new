import { track } from '@bounty/track';
import { TRPCError } from '@trpc/server';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { randomInt, randomBytes, timingSafeEqual } from 'node:crypto';

const info = console.info.bind(console);
const error = console.error.bind(console);
const warn = console.warn.bind(console);

// Generate 6-digit OTP code using cryptographically secure random number
const generateOTP = (): string => {
  // Generate a number between 100000 (inclusive) and 1000000 (exclusive)
  const code = randomInt(100_000, 1_000_000);
  // Convert to string and pad with zeros if necessary (shouldn't be needed but ensures 6 digits)
  return code.toString().padStart(6, '0');
};

// Generate secure random token for access grant
const generateAccessToken = (): string => {
  return randomBytes(32).toString('hex');
};

import {
  db,
  user as userTable,
  waitlist,
  bounty,
  userProfile,
  organization,
  member,
} from '@bounty/db';
import {
  AlphaAccessGranted,
  FROM_ADDRESSES,
  sendEmail,
  OTPVerification,
} from '@bounty/email';
import {
  adminProcedure,
  publicProcedure,
  protectedProcedure,
  router,
  rateLimitedPublicProcedure,
} from '../trpc';

export const earlyAccessRouter = router({
  getWaitlistCount: publicProcedure.query(async () => {
    try {
      info('[getWaitlistCount] called');
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist);
      const count = result?.count ?? 0;
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
  // Rate-limited endpoint for adding emails to waitlist (5 requests/minute)
  addToWaitlist: rateLimitedPublicProcedure('waitlist')
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        info('[addToWaitlist] Processing new entry');

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

        const [totalResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(waitlist);
        const total = totalResult?.count ?? 0;

        const [grantedResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(waitlist)
          .where(
            and(
              sql`${waitlist.accessToken} IS NOT NULL`,
              sql`${waitlist.accessGrantedAt} IS NOT NULL`
            )
          );
        const totalGrantedAccess = grantedResult?.count ?? 0;

        return {
          entries,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          stats: {
            total,
            grantedAccess: totalGrantedAccess,
            pending: total - totalGrantedAccess,
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

  // Grant waitlist access - generates token and sends email
  grantWaitlistAccess: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id } = input;

        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.id, id),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          });
        }

        // Generate access token
        const token = generateAccessToken();

        // Store token and set access granted timestamp
        await db
          .update(waitlist)
          .set({
            accessToken: token,
            accessGrantedAt: new Date(),
          })
          .where(eq(waitlist.id as any, id) as any);

        info('[grantWaitlistAccess] Granted access for ID:', id);

        // Send email with access link
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
          subject: "You're in! Access bounty.new now",
          from: FROM_ADDRESSES.notifications,
          react: AlphaAccessGranted({
            name: u?.name ?? '',
            token,
          }),
        });

        return { success: true };
      } catch (err) {
        error('[grantWaitlistAccess] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to grant waitlist access',
        });
      }
    }),

  // Accept access token - validates and grants early_access role
  acceptAccessToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { token } = input;
        const userId = ctx.session.user.id;
        const userEmail = ctx.session.user.email;

        // Find waitlist entry with this token
        const entry = await db.query.waitlist.findFirst({
          where: (fields, { eq }) => eq(fields.accessToken, token),
        });

        if (!entry) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid or expired token',
          });
        }

        // Verify the email matches
        if (entry.email !== userEmail) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This token was issued for a different email address',
          });
        }

        // Grant early_access role
        await db
          .update(userTable)
          .set({ role: 'early_access' })
          .where(eq(userTable.id, userId));

        // Clear the token (one-time use)
        await db
          .update(waitlist)
          .set({ accessToken: null })
          .where(eq(waitlist.id as any, entry.id) as any);

        info('[acceptAccessToken] Granted early_access to user:', userId);

        return { success: true };
      } catch (err) {
        error('[acceptAccessToken] Error:', err);
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to accept access token',
        });
      }
    }),

  submitWithBounty: rateLimitedPublicProcedure('waitlist')
    .input(
      z.object({
        email: z.string().email(),
        bountyTitle: z.string().optional(),
        bountyDescription: z.string().optional(),
        bountyAmount: z.string().optional(),
        bountyGithubIssueUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
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
          const [posResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(waitlist)
            .where(sql`${waitlist.createdAt} < ${existingEntry.createdAt}`);
          position = (posResult?.count ?? 0) + 1;

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
              bountyGithubIssueUrl:
                input.bountyGithubIssueUrl ??
                existingEntry.bountyGithubIssueUrl,
              position,
            })
            .where(eq(waitlist.id as any, entryId) as any);
        } else {
          // Create new entry
          // Get position (count of existing entries)
          const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(waitlist);
          position = (countResult?.count ?? 0) + 1;

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
        entryId: z.string(),
        code: z.string().length(6, 'OTP code must be 6 digits'),
      })
    )
    .mutation(async ({ input }) => {
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

        // Verify OTP using constant-time comparison to prevent timing attacks
        const otpMatch =
          entry.otpCode != null &&
          entry.otpCode.length === input.code.length &&
          timingSafeEqual(
            Buffer.from(entry.otpCode),
            Buffer.from(input.code)
          );
        if (!otpMatch) {
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

        info('[verifyOTP] Entry verified:', input.entryId);
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

  resendOTP: rateLimitedPublicProcedure('waitlist')
    .input(
      z.object({
        entryId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
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

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Generate new OTP but do NOT reset otpAttempts to prevent bypass
        await db
          .update(waitlist)
          .set({
            otpCode,
            otpExpiresAt,
          })
          .where(eq(waitlist.id as any, entry.id) as any);

        // Send OTP email
        try {
          await sendEmail({
            to: entry.email,
            subject: `Your verification code: ${otpCode}`,
            from: FROM_ADDRESSES.notifications,
            react: OTPVerification({
              code: otpCode,
              entryId: entry.id,
              email: entry.email,
            }),
          });
        } catch (emailError) {
          warn('[resendOTP] Failed to send email:', emailError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send verification email',
          });
        }

        info('[resendOTP] OTP resent for entry:', input.entryId);
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

        // Calculate position if not set
        let position = entry.position;
        if (!position) {
          const entriesBefore = await db
            .select({ count: sql<number>`count(*)` })
            .from(waitlist)
            .where(sql`${waitlist.createdAt} < ${entry.createdAt}`);
          position = (entriesBefore[0]?.count ?? 0) + 1;

          // Update position in database for future queries
          await db
            .update(waitlist)
            .set({ position })
            .where(eq(waitlist.id as any, entry.id) as any);
        }

        // Only return non-sensitive fields — no email, userId, or bounty details
        return {
          success: true,
          data: {
            id: entry.id,
            emailVerified: entry.emailVerified,
            position,
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

      // If no entry exists, create one using the user's email
      if (!entry && userEmail) {
        // Calculate position (count of existing entries)
        const [countRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(waitlist);
        const position = (countRes?.count ?? 0) + 1;

        const [newEntry] = await db
          .insert(waitlist)
          .values({
            email: userEmail,
            userId,
            position,
            createdAt: new Date(),
          })
          .returning();

        if (newEntry) {
          info('[getMyWaitlistEntry] Auto-created entry for user:', userId);

          // Fetch the full entry to get position
          entry = await db.query.waitlist.findFirst({
            where: (fields, { eq }) => eq(fields.id, newEntry.id),
          });
        }
      }

      if (!entry) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create waitlist entry',
        });
      }

      // Calculate position if not set
      let position = entry.position;
      if (!position) {
        const [posRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(waitlist)
          .where(sql`${waitlist.createdAt} < ${entry.createdAt}`);
        position = (posRes?.count ?? 0) + 1;

        // Update position in database for future queries
        await db
          .update(waitlist)
          .set({ position })
          .where(eq(waitlist.id as any, entry.id) as any);
      }

      return {
        id: entry.id,
        email: entry.email,
        emailVerified: entry.emailVerified,
        position,
        bountyTitle: entry.bountyTitle,
        bountyDescription: entry.bountyDescription,
        bountyAmount: entry.bountyAmount,
        bountyDeadline: entry.bountyDeadline,
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
        role: z.enum(['creator', 'developer']).optional(),
        githubId: z.string().optional(),
        githubUsername: z.string().optional(),
        name: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const userEmail = ctx.session.user.email;

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

        // Verify the entry's email matches the authenticated user's email
        // to prevent hijacking of other users' waitlist entries
        if (entry.email !== userEmail) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only link your own waitlist entry',
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

        // Update userProfile with GitHub username and role preference if provided
        if (input.githubUsername || input.role) {
          const existingProfile = await db.query.userProfile.findFirst({
            where: (fields, { eq }) => eq(fields.userId, userId),
          });

          const profileUpdate: {
            githubUsername?: string;
            updatedAt: Date;
          } = {
            updatedAt: new Date(),
          };

          if (input.githubUsername) {
            profileUpdate.githubUsername = input.githubUsername;
          }

          if (existingProfile) {
            await db
              .update(userProfile)
              .set(profileUpdate)
              .where(eq(userProfile.userId as any, userId) as any);
          } else {
            await db.insert(userProfile).values({
              userId,
              ...profileUpdate,
            });
          }

          if (input.role) {
            info(
              '[linkUserToWaitlist] Role preference:',
              input.role,
              'for user:',
              userId
            );
          }
        }

        // Create real bounty from draft if draft data exists
        let bountyId: string | null = null;
        if (entry.bountyTitle && entry.bountyAmount) {
          try {
            // Look up the user's personal team to scope the bounty
            const personalTeam = await db
              .select({ organizationId: member.organizationId })
              .from(member)
              .innerJoin(
                organization,
                eq(organization.id, member.organizationId)
              )
              .where(
                and(
                  eq(member.userId, userId),
                  eq(organization.isPersonal, true)
                )
              )
              .limit(1);

            const organizationId = personalTeam[0]?.organizationId;
            if (!organizationId) {
              warn(
                '[linkUserToWaitlist] No personal team found for user:',
                userId,
                '— bounty will be created without organizationId'
              );
            }

            const [newBounty] = await db
              .insert(bounty)
              .values({
                title: entry.bountyTitle,
                description: entry.bountyDescription ?? '',
                amount: entry.bountyAmount,
                currency: 'USD',
                status: 'draft',
                issueUrl: entry.bountyGithubIssueUrl ?? undefined,
                createdById: userId,
                organizationId: organizationId ?? undefined,
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

  updateBountyDraft: protectedProcedure
    .input(
      z.object({
        entryId: z.string(),
        bountyTitle: z.string().optional(),
        bountyDescription: z.string().optional(),
        bountyAmount: z.string().optional(),
        bountyDeadline: z
          .string()
          .optional()
          .refine(
            (val) => {
              if (!val || val === '') {
                return true; // Optional field
              }
              try {
                const date = new Date(val);
                if (Number.isNaN(date.getTime())) {
                  return false; // Invalid date
                }
                // Compare dates (ignore time for day-level comparison)
                const dateOnly = new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate()
                );
                const nowOnly = new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate()
                );
                return dateOnly >= nowOnly; // Must be today or in the future
              } catch {
                return false;
              }
            },
            {
              message: 'Deadline must be today or in the future',
            }
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { entryId, ...bountyData } = input;
        const userId = ctx.session.user.id;
        const userEmail = ctx.session.user.email;

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

        // Verify ownership: check userId match or email match
        const isOwner = entry.userId === userId || entry.email === userEmail;
        if (!isOwner) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this waitlist entry',
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
            bountyDeadline: bountyData.bountyDeadline
              ? new Date(bountyData.bountyDeadline)
              : entry.bountyDeadline,
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
