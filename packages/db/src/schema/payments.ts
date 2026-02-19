import { sql } from "drizzle-orm";
import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	decimal,
	index,
} from "drizzle-orm/pg-core";
import { bounty } from "./bounties";
import { user } from "./auth";

export const transactionTypeEnum = pgEnum("transaction_type", [
	"payment_intent",
	"transfer",
	"refund",
	"payout",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
	"pending",
	"processing",
	"completed",
	"failed",
]);

export const transaction = pgTable(
	"transaction",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		bountyId: text("bounty_id")
			.notNull()
			.references(() => bounty.id, { onDelete: "cascade" }),
		type: transactionTypeEnum("type").notNull(),
		amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
		stripeId: text("stripe_id").notNull(),
		createdAt: timestamp("created_at").notNull().default(sql`now()`),
	},
	(t) => [
		index("transaction_bounty_id_idx").on(t.bountyId),
		index("transaction_stripe_id_idx").on(t.stripeId),
	],
);

export const payout = pgTable(
	"payout",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		bountyId: text("bounty_id")
			.notNull()
			.references(() => bounty.id, { onDelete: "cascade" }),
		amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
		status: payoutStatusEnum("status").notNull().default("pending"),
		stripeTransferId: text("stripe_transfer_id"),
		createdAt: timestamp("created_at").notNull().default(sql`now()`),
		updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
	},
	(t) => [
		index("payout_user_id_idx").on(t.userId),
		index("payout_bounty_id_idx").on(t.bountyId),
		index("payout_stripe_transfer_id_idx").on(t.stripeTransferId),
	],
);
