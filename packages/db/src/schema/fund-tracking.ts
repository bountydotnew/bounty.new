import { sql } from 'drizzle-orm';
import {
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { bounty } from './bounties';

export const fundStatusEnum = pgEnum('fund_status', [
  'pending',
  'held',
  'released',
  'refunded',
]);

export const fundTracking = pgTable(
  'fund_tracking',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    paymentIntentId: text('payment_intent_id').notNull(),
    transferGroup: text('transfer_group').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: fundStatusEnum('status').notNull().default('pending'),
    stripeTransferId: text('stripe_transfer_id'),
    platformFeeAmount: decimal('platform_fee_amount', {
      precision: 15,
      scale: 2,
    }).notNull(),
    netAmount: decimal('net_amount', { precision: 15, scale: 2 }).notNull(),
    refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),
    refundReason: text('refund_reason'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('fund_tracking_bounty_id_idx').on(t.bountyId),
    index('fund_tracking_user_id_idx').on(t.userId),
    index('fund_tracking_status_idx').on(t.status),
    index('fund_tracking_transfer_group_idx').on(t.transferGroup),
    index('fund_tracking_payment_intent_id_idx').on(t.paymentIntentId),
  ]
);
