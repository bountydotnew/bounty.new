import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { account } from './auth';

export const githubInstallation = pgTable(
  'github_installation',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    githubInstallationId: integer('github_installation_id').notNull().unique(),
    githubAccountId: text('github_account_id').references(() => account.id, {
      onDelete: 'cascade',
    }),
    repositoryIds: text('repository_ids').array(),
    // GitHub app metadata
    accountLogin: text('account_login'), // Org or user login
    accountType: text('account_type'), // 'User' or 'Organization'
    accountAvatarUrl: text('account_avatar_url'),
    isDefault: boolean('is_default').notNull().default(false),
    suspendedAt: timestamp('suspended_at'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex('github_installation_unique_idx').on(
      t.githubInstallationId
    ),
    index('github_installation_account_id_idx').on(t.githubAccountId),
  ]
);

export type GithubInstallation = typeof githubInstallation.$inferSelect;
export type NewGithubInstallation = typeof githubInstallation.$inferInsert;
