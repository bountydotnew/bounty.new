import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { onboardingState, onboardingCoupon } from '@bounty/db/src/schema/onboarding';
import { waitlist } from '@bounty/db/src/schema/auth';
import { user } from '@bounty/db';
import { eq } from 'drizzle-orm';

export const onboardingRouter = router({
  /**
   * Get the user's onboarding state
   */
  getState: protectedProcedure.query(async ({ ctx }) => {
    const [state] = await ctx.db
      .select()
      .from(onboardingState)
      .where(eq(onboardingState.userId, ctx.session.user.id))
      .limit(1);

    if (!state) {
      return {
        completedStep1: false,
        completedStep2: false,
        completedStep3: false,
        completedStep4: false,
        source: null,
        claimedWaitlistDiscount: false,
      };
    }

    return {
      completedStep1: state.completedStep1,
      completedStep2: state.completedStep2,
      completedStep3: state.completedStep3,
      completedStep4: state.completedStep4,
      source: state.source,
      claimedWaitlistDiscount: state.claimedWaitlistDiscount,
    };
  }),

  /**
   * Check if user's email is on the waitlist
   */
  checkWaitlist: protectedProcedure.query(async ({ ctx }) => {
    const [userRecord] = await ctx.db
      .select()
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);

    if (!userRecord?.email) {
      return { isOnWaitlist: false };
    }

    const [waitlistEntry] = await ctx.db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, userRecord.email))
      .limit(1);

    return {
      isOnWaitlist: !!waitlistEntry,
    };
  }),

  /**
   * Complete an onboarding step
   */
  completeStep: protectedProcedure
    .input(z.object({
      step: z.number().min(1).max(4),
    }))
    .mutation(async ({ input, ctx }) => {
      const stepField = `completedStep${input.step}` as const;

      // Check if state exists
      const [existingState] = await ctx.db
        .select()
        .from(onboardingState)
        .where(eq(onboardingState.userId, ctx.session.user.id))
        .limit(1);

      if (existingState) {
        // Update existing state
        await ctx.db
          .update(onboardingState)
          .set({
            [stepField]: true,
            updatedAt: new Date(),
          })
          .where(eq(onboardingState.userId, ctx.session.user.id));
      } else {
        // Create new state
        await ctx.db
          .insert(onboardingState)
          .values({
            userId: ctx.session.user.id,
            [stepField]: true,
          });
      }

      return { success: true };
    }),

  /**
   * Save how the user found us (from step 3)
   */
  saveSource: protectedProcedure
    .input(z.object({
      source: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if state exists
      const [existingState] = await ctx.db
        .select()
        .from(onboardingState)
        .where(eq(onboardingState.userId, ctx.session.user.id))
        .limit(1);

      if (existingState) {
        // Update existing state
        await ctx.db
          .update(onboardingState)
          .set({
            source: input.source,
            completedStep3: true,
            updatedAt: new Date(),
          })
          .where(eq(onboardingState.userId, ctx.session.user.id));
      } else {
        // Create new state
        await ctx.db
          .insert(onboardingState)
          .values({
            userId: ctx.session.user.id,
            source: input.source,
            completedStep3: true,
          });
      }

      return { success: true };
    }),

  /**
   * Claim waitlist discount and generate coupon code
   */
  claimWaitlistDiscount: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check if user has already claimed
      const [existingCoupon] = await ctx.db
        .select()
        .from(onboardingCoupon)
        .where(eq(onboardingCoupon.userId, ctx.session.user.id))
        .limit(1);

      if (existingCoupon) {
        return {
          success: true,
          code: existingCoupon.code,
          alreadyClaimed: true,
        };
      }

      // Generate coupon code (20% off Pro plan)
      const code = `WELCOME20-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create coupon
      await ctx.db
        .insert(onboardingCoupon)
        .values({
          userId: ctx.session.user.id,
          code,
          // Expires in 30 days
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

      // Update onboarding state
      const [existingState] = await ctx.db
        .select()
        .from(onboardingState)
        .where(eq(onboardingState.userId, ctx.session.user.id))
        .limit(1);

      if (existingState) {
        await ctx.db
          .update(onboardingState)
          .set({
            claimedWaitlistDiscount: true,
            completedStep1: true,
            updatedAt: new Date(),
          })
          .where(eq(onboardingState.userId, ctx.session.user.id));
      } else {
        await ctx.db
          .insert(onboardingState)
          .values({
            userId: ctx.session.user.id,
            claimedWaitlistDiscount: true,
            completedStep1: true,
          });
      }

      return {
        success: true,
        code,
        alreadyClaimed: false,
      };
    }),
});
