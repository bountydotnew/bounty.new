import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './schema/auth';
import * as betaApplicationsSchema from './schema/beta-applications';
import * as bountiesSchema from './schema/bounties';
import * as featureVotesSchema from './schema/feature-votes';
import * as invitesSchema from './schema/invites';
import * as linearAccountSchema from './schema/linear-account';
import * as notificationsSchema from './schema/notifications';
import * as passkeySchema from './schema/passkey';
import * as profilesSchema from './schema/profiles';
import * as paymentsSchema from './schema/payments';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  // Pool tuning: default pg max is 10, which can bottleneck under concurrent load
  max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
  // Return idle connections after 30s to avoid holding stale connections
  idleTimeoutMillis: 30_000,
  // Fail fast if pool is exhausted rather than queuing indefinitely
  connectionTimeoutMillis: 10_000,
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
    ...paymentsSchema,
    ...featureVotesSchema,
    ...linearAccountSchema,
  },
});

// Export all schemas
export * from './schema/auth';
export * from './schema/beta-applications';
export * from './schema/bounties';
export * from './schema/feature-votes';
export * from './schema/invites';
export * from './schema/linear-account';
export * from './schema/notifications';
export * from './schema/passkey';
export * from './schema/profiles';
export * from './services';
export * from './schema/payments';
