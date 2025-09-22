import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { fundTrackingService } from '../lib/fund-tracking';
import { adminProcedure, protectedProcedure, router } from '../trpc';

const createFundTrackingSchema = z.object({
  bountyId: z.string(),
  userId: z.string(),
  paymentIntentId: z.string(),
  transferGroup: z.string(),
  amount: z.string(),
  currency: z.string().default('USD'),
  platformFeeAmount: z.string(),
  netAmount: z.string(),
});

const updateFundTrackingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'held', 'released', 'refunded']),
  stripeTransferId: z.string().optional(),
  refundAmount: z.string().optional(),
  refundReason: z.string().optional(),
});

export const fundTrackingRouter = router({
  create: protectedProcedure
    .input(createFundTrackingSchema)
    .mutation(async ({ input }) => {
      try {
        const fundRecord = await fundTrackingService.create(input);
        return {
          success: true,
          data: fundRecord,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create fund tracking record',
          cause: error,
        });
      }
    }),

  updateStatus: protectedProcedure
    .input(updateFundTrackingStatusSchema)
    .mutation(async ({ input }) => {
      try {
        const updatedRecord = await fundTrackingService.updateStatus(input);
        return {
          success: true,
          data: updatedRecord,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update fund tracking status',
          cause: error,
        });
      }
    }),

  getByBounty: protectedProcedure
    .input(z.object({ bountyId: z.string() }))
    .query(async ({ input }) => {
      try {
        const records = await fundTrackingService.getByBountyId(input.bountyId);
        return {
          success: true,
          data: records,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch fund tracking records',
          cause: error,
        });
      }
    }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const currentUserId = ctx.session?.user?.id;

      // Users can only view their own fund tracking records unless they're admin
      if (currentUserId !== input.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own fund tracking records',
        });
      }

      try {
        const records = await fundTrackingService.getByUserId(input.userId);
        return {
          success: true,
          data: records,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch fund tracking records',
          cause: error,
        });
      }
    }),

  getByPaymentIntent: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const record = await fundTrackingService.getByPaymentIntentId(
          input.paymentIntentId
        );
        return {
          success: true,
          data: record,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch fund tracking record',
          cause: error,
        });
      }
    }),

  getByTransferGroup: adminProcedure
    .input(z.object({ transferGroup: z.string() }))
    .query(async ({ input }) => {
      try {
        const records = await fundTrackingService.getByTransferGroup(
          input.transferGroup
        );
        return {
          success: true,
          data: records,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch fund tracking records',
          cause: error,
        });
      }
    }),

  calculatePlatformFee: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .query(async ({ input }) => {
      const feeData = fundTrackingService.calculatePlatformFee(input.amount);
      return {
        success: true,
        data: feeData,
      };
    }),

  generateTransferGroup: protectedProcedure
    .input(z.object({ bountyId: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      const transferGroup = fundTrackingService.generateTransferGroup(
        input.bountyId,
        input.userId
      );
      return {
        success: true,
        data: { transferGroup },
      };
    }),
});
