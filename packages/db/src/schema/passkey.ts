import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const passkey = pgTable('passkey', {
  id: text('id').primaryKey(),
  name: text('name'),
  publicKey: text('publicKey').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  credentialID: text('credentialID').notNull(),
  counter: integer('counter').notNull(),
  deviceType: text('deviceType').notNull(),
  backedUp: boolean('backedUp').notNull(),
  transports: text('transports').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  aaguid: text('aaguid'),
}, (t) => [
  index('passkey_user_id_idx').on(t.userId),
  uniqueIndex('passkey_credential_id_unique_idx').on(t.credentialID),
  index('passkey_device_type_idx').on(t.deviceType),
  index('passkey_backed_up_idx').on(t.backedUp),
  index('passkey_created_at_idx').on(t.createdAt),
]);
