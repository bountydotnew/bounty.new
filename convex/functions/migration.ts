/**
 * Migration helpers — resolve legacy PG IDs after JSONL import.
 *
 * After importing tables via `npx convex import`, run these to fix
 * FK references that still contain PG UUIDs.
 */
import {
  internalAction,
  internalQuery,
  internalMutation,
} from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

/**
 * Build a mapping of legacyPgId → Convex _id for a given table.
 * Each imported row should have a `legacyPgId` string field.
 */
export const buildIdMap = internalQuery({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const tableName = args.table as any;
    const rows = await ctx.db.query(tableName).collect();
    const map: Record<string, string> = {};
    for (const row of rows) {
      const pgId = (row as any).legacyPgId;
      if (pgId) {
        map[pgId] = row._id as string;
      }
    }
    return map;
  },
});

/**
 * Resolve FK references on bounties table.
 * Replaces PG UUID strings in createdById, assignedToId, organizationId
 * with actual Convex IDs using the user/org ID maps.
 */
export const resolveBountyFks = internalMutation({
  args: {
    userMap: v.any(), // Record<pgId, convexId>
    orgMap: v.any(),
  },
  handler: async (ctx, args) => {
    const bounties = await ctx.db.query('bounties').collect();
    let fixed = 0;
    for (const b of bounties) {
      const patch: Record<string, any> = {};

      // createdById — resolve from user map
      const creatorPgId = b.createdById as unknown as string;
      if (args.userMap[creatorPgId]) {
        patch.createdById = args.userMap[creatorPgId];
      }

      // assignedToId
      if (b.assignedToId) {
        const assigneePgId = b.assignedToId as unknown as string;
        if (args.userMap[assigneePgId]) {
          patch.assignedToId = args.userMap[assigneePgId];
        }
      }

      // organizationId
      if (b.organizationId) {
        const orgPgId = b.organizationId as unknown as string;
        if (args.orgMap[orgPgId]) {
          patch.organizationId = args.orgMap[orgPgId];
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(b._id, patch);
        fixed++;
      }
    }
    return { fixed, total: bounties.length };
  },
});

/**
 * Resolve FK references on submissions table.
 */
export const resolveSubmissionFks = internalMutation({
  args: {
    userMap: v.any(),
    bountyMap: v.any(),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db.query('submissions').collect();
    let fixed = 0;
    for (const s of subs) {
      const patch: Record<string, any> = {};

      const bountyPgId = s.bountyId as unknown as string;
      if (args.bountyMap[bountyPgId])
        patch.bountyId = args.bountyMap[bountyPgId];

      const userPgId = s.contributorId as unknown as string;
      if (args.userMap[userPgId]) patch.contributorId = args.userMap[userPgId];

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(s._id, patch);
        fixed++;
      }
    }
    return { fixed, total: subs.length };
  },
});

/**
 * Generic: resolve a single FK field on all rows of a table.
 */
export const resolveFk = internalMutation({
  args: {
    table: v.string(),
    field: v.string(),
    idMap: v.any(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query(args.table as any).collect();
    let fixed = 0;
    for (const row of rows) {
      const oldId = (row as any)[args.field] as string | undefined;
      if (oldId && args.idMap[oldId]) {
        await ctx.db.patch(row._id, { [args.field]: args.idMap[oldId] });
        fixed++;
      }
    }
    return { fixed, total: rows.length };
  },
});

/**
 * Remove legacyPgId field from all rows in a table (cleanup after migration).
 */
export const removeLegacyIds = internalMutation({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query(args.table as any).collect();
    let cleaned = 0;
    for (const row of rows) {
      if ((row as any).legacyPgId !== undefined) {
        await ctx.db.patch(row._id, { legacyPgId: undefined } as any);
        cleaned++;
      }
    }
    return { cleaned, total: rows.length };
  },
});
