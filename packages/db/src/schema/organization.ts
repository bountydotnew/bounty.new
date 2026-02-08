import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// ============================================================================
// Enums
// ============================================================================

export const orgMemberRoleEnum = pgEnum('org_member_role', [
  'owner',
  'member',
]);

export const orgInvitationStatusEnum = pgEnum('org_invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'canceled',
  'expired',
]);

// ============================================================================
// Organization
// ============================================================================

/**
 * Organization (Team) — managed by Better Auth organization plugin.
 *
 * Better Auth expects: id, name, slug, logo, metadata, createdAt.
 * We add custom fields: isPersonal, stripeCustomerId.
 */
export const organization = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'), // JSON string, used by Better Auth
    // Custom fields
    isPersonal: boolean('is_personal').notNull().default(false),
    stripeCustomerId: text('stripe_customer_id'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  }
  // slug already has a unique constraint which implicitly creates an index
);

// ============================================================================
// Member
// ============================================================================

/**
 * Organization Member — managed by Better Auth organization plugin.
 *
 * Better Auth expects: id, userId, organizationId, role, createdAt.
 */
export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex('member_org_user_idx').on(t.organizationId, t.userId),
    index('member_user_id_idx').on(t.userId),
    // member_org_id_idx removed: covered by the leading column of member_org_user_idx
  ]
);

// ============================================================================
// Invitation
// ============================================================================

/**
 * Organization Invitation — managed by Better Auth organization plugin.
 *
 * Better Auth expects: id, email, inviterId, organizationId, role, status, expiresAt, createdAt.
 */
export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    status: orgInvitationStatusEnum('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('invitation_org_id_idx').on(t.organizationId),
    index('invitation_email_idx').on(t.email),
  ]
);

// ============================================================================
// Type Exports
// ============================================================================

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
