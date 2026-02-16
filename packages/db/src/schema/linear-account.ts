import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { account } from './auth';
import { organization } from './organization';

/**
 * Linear Account - stores Linear workspace connections per user account
 *
 * This table manages the connection between a bounty.new user's OAuth account
 * and their Linear workspace(s). A user can connect multiple Linear workspaces.
 */
export const linearAccount = pgTable(
  'linear_account',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    accountId: text('account_id')
      .notNull()
      .references(() => account.id, {
        onDelete: 'cascade',
      }),
    // Linear user and workspace identifiers
    linearUserId: text('linear_user_id').notNull(),
    linearWorkspaceId: text('linear_workspace_id').notNull(),
    linearWorkspaceName: text('linear_workspace_name').notNull(),
    linearWorkspaceUrl: text('linear_workspace_url'),
    linearWorkspaceKey: text('linear_workspace_key'), // e.g., "acme-corp"
    // Active status - allows users to disconnect without deleting
    isActive: boolean('is_active').notNull().default(true),
    // Organization scoping
    organizationId: text('organization_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    // Unique constraint: one account per workspace per OAuth account
    uniqueIndex('linear_account_workspace_idx').on(
      t.accountId,
      t.linearWorkspaceId
    ),
    // Index for querying user's workspaces
    index('linear_account_user_idx').on(t.linearUserId),
    // Index for workspace lookups
    index('linear_account_workspace_id_idx').on(t.linearWorkspaceId),
    index('linear_account_organization_id_idx').on(t.organizationId),
  ]
);

export type LinearAccount = typeof linearAccount.$inferSelect;
export type NewLinearAccount = typeof linearAccount.$inferInsert;
