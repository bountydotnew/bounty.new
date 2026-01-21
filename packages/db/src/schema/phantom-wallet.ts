import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

/**
 * Phantom Wallet Connections
 *
 * Stores connected Solana wallets for users and tracks token holder benefits.
 */
export const phantomWallet = pgTable('phantom_wallet', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Solana wallet public key (base58 encoded)
  walletAddress: text('wallet_address').notNull(),
  // Last verified token balance in lamports/smallest unit
  lastTokenBalance: text('last_token_balance'),
  // Last USD value of token holdings
  lastTokenValueUsd: text('last_token_value_usd'),
  // Whether the wallet currently qualifies for token holder benefits
  qualifiesForBenefits: boolean('qualifies_for_benefits').notNull().default(false),
  // When the free month was granted (null if never granted)
  freeMonthGrantedAt: timestamp('free_month_granted_at'),
  // Last time the balance was verified
  lastVerifiedAt: timestamp('last_verified_at'),
  // Signature used to verify wallet ownership
  verificationSignature: text('verification_signature'),
  // Message that was signed for verification
  verificationMessage: text('verification_message'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});
