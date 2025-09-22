import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './schema/auth';
import * as betaApplicationsSchema from './schema/beta-applications';
import * as bountiesSchema from './schema/bounties';
import * as invitesSchema from './schema/invites';
import * as notificationsSchema from './schema/notifications';
import * as passkeySchema from './schema/passkey';
import * as profilesSchema from './schema/profiles';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used this many times
  keepAlive: true,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...bountiesSchema,
    ...profilesSchema,
    ...betaApplicationsSchema,
    ...passkeySchema,
    ...notificationsSchema,
    ...invitesSchema,
  },
});

// Export all schemas
export * from './schema/auth';
export * from './schema/beta-applications';
export * from './schema/bounties';
export * from './schema/invites';
export * from './schema/notifications';
export * from './schema/passkey';
export * from './schema/profiles';
export * from './services';
