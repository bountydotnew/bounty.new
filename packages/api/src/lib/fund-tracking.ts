import { db } from '@bounty/db';
import { fundTracking, type fundStatusEnum } from '@bounty/db';
import { eq } from 'drizzle-orm';

export interface CreateFundTrackingInput {
  bountyId: string;
  userId: string;
  paymentIntentId: string;
  transferGroup: string;
  amount: string;
  currency?: string;
  platformFeeAmount: string;
  netAmount: string;
}

export interface UpdateFundTrackingStatusInput {
  id: string;
  status: typeof fundStatusEnum.enumValues[number];
  stripeTransferId?: string;
  refundAmount?: string;
  refundReason?: string;
}

export const fundTrackingService = {
  async create(input: CreateFundTrackingInput) {
    const [fundRecord] = await db
      .insert(fundTracking)
      .values({
        bountyId: input.bountyId,
        userId: input.userId,
        paymentIntentId: input.paymentIntentId,
        transferGroup: input.transferGroup,
        amount: input.amount,
        currency: input.currency || 'USD',
        status: 'pending',
        platformFeeAmount: input.platformFeeAmount,
        netAmount: input.netAmount,
      })
      .returning();

    return fundRecord;
  },

  async updateStatus(input: UpdateFundTrackingStatusInput) {
    const updateData: {
      status: 'pending' | 'held' | 'released' | 'refunded';
      updatedAt: Date;
      stripeTransferId?: string;
      refundAmount?: string;
      refundReason?: string;
    } = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.stripeTransferId) {
      updateData.stripeTransferId = input.stripeTransferId;
    }

    if (input.refundAmount) {
      updateData.refundAmount = input.refundAmount;
    }

    if (input.refundReason) {
      updateData.refundReason = input.refundReason;
    }

    const [updatedRecord] = await db
      .update(fundTracking)
      .set(updateData)
      .where(eq(fundTracking.id, input.id))
      .returning();

    return updatedRecord;
  },

  async getByBountyId(bountyId: string) {
    return await db
      .select()
      .from(fundTracking)
      .where(eq(fundTracking.bountyId, bountyId));
  },

  async getByUserId(userId: string) {
    return await db
      .select()
      .from(fundTracking)
      .where(eq(fundTracking.userId, userId));
  },

  async getByPaymentIntentId(paymentIntentId: string) {
    const [record] = await db
      .select()
      .from(fundTracking)
      .where(eq(fundTracking.paymentIntentId, paymentIntentId));

    return record;
  },

  async getByTransferGroup(transferGroup: string) {
    return await db
      .select()
      .from(fundTracking)
      .where(eq(fundTracking.transferGroup, transferGroup));
  },

  generateTransferGroup(bountyId: string, userId: string): string {
    return `bounty_${bountyId}_${userId}`;
  },

  calculatePlatformFee(amount: number, feePercent = 5): { platformFee: number; netAmount: number } {
    const platformFee = Math.round((amount * feePercent) / 100);
    const netAmount = amount - platformFee;
    return { platformFee, netAmount };
  },
};