import { sql } from 'drizzle-orm';
import { desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { bounty, bountyVote, bountyComment, user } from '../schema';

export interface CachedBountyStats {
  id: string;
  voteCount: number;
  commentCount: number;
  updatedAt: Date;
}

export interface CachedBountyDetails extends CachedBountyStats {
  title: string;
  description: string;
  amount: string;
  status: string;
  difficulty: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const bountyStatsCache = new Map<string, { data: CachedBountyStats; expires: number }>();
const bountyDetailsCache = new Map<string, { data: CachedBountyDetails; expires: number }>();

export async function getCachedBountyStats(bountyId: string): Promise<CachedBountyStats | null> {
  const cached = bountyStatsCache.get(bountyId);

  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  try {
    const [stats] = await db
      .select({
        id: bounty.id,
        voteCount: sql<number>`
          (SELECT count(*)::int FROM ${bountyVote} WHERE ${bountyVote.bountyId} = ${bounty.id})
        `,
        commentCount: sql<number>`
          (SELECT count(*)::int FROM ${bountyComment} WHERE ${bountyComment.bountyId} = ${bounty.id})
        `,
        updatedAt: bounty.updatedAt,
      })
      .from(bounty)
      .where(eq(bounty.id, bountyId))
      .limit(1);

    if (!stats) return null;

    const result: CachedBountyStats = {
      id: stats.id,
      voteCount: Number(stats.voteCount),
      commentCount: Number(stats.commentCount),
      updatedAt: stats.updatedAt,
    };

    bountyStatsCache.set(bountyId, {
      data: result,
      expires: Date.now() + CACHE_TTL,
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch bounty stats:', error);
    return null;
  }
}

export async function getCachedBountyDetails(bountyId: string): Promise<CachedBountyDetails | null> {
  const cached = bountyDetailsCache.get(bountyId);

  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  try {
    const [details] = await db
      .select({
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        amount: bounty.amount,
        status: bounty.status,
        difficulty: bounty.difficulty,
        updatedAt: bounty.updatedAt,
        voteCount: sql<number>`
          (SELECT count(*)::int FROM ${bountyVote} WHERE ${bountyVote.bountyId} = ${bounty.id})
        `,
        commentCount: sql<number>`
          (SELECT count(*)::int FROM ${bountyComment} WHERE ${bountyComment.bountyId} = ${bounty.id})
        `,
        createdBy: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(bounty)
      .innerJoin(user, eq(bounty.createdById, user.id))
      .where(eq(bounty.id, bountyId))
      .limit(1);

    if (!details) return null;

    const result: CachedBountyDetails = {
      id: details.id,
      title: details.title,
      description: details.description,
      amount: details.amount,
      status: details.status,
      difficulty: details.difficulty,
      voteCount: Number(details.voteCount),
      commentCount: Number(details.commentCount),
      updatedAt: details.updatedAt,
      createdBy: details.createdBy,
    };

    bountyDetailsCache.set(bountyId, {
      data: result,
      expires: Date.now() + CACHE_TTL,
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch bounty details:', error);
    return null;
  }
}

export async function getBountyStatsBatch(bountyIds: string[]): Promise<CachedBountyStats[]> {
  if (bountyIds.length === 0) return [];

  const results: CachedBountyStats[] = [];
  const uncachedIds: string[] = [];
  const now = Date.now();

  bountyIds.forEach(id => {
    const cached = bountyStatsCache.get(id);
    if (cached && now < cached.expires) {
      results.push(cached.data);
    } else {
      uncachedIds.push(id);
    }
  });

  if (uncachedIds.length > 0) {
    try {
      const freshStats = await db
        .select({
          id: bounty.id,
          voteCount: sql<number>`
            (SELECT count(*)::int FROM ${bountyVote} WHERE ${bountyVote.bountyId} = ${bounty.id})
          `,
          commentCount: sql<number>`
            (SELECT count(*)::int FROM ${bountyComment} WHERE ${bountyComment.bountyId} = ${bounty.id})
          `,
          updatedAt: bounty.updatedAt,
        })
        .from(bounty)
        .where(sql`${bounty.id} = ANY(${uncachedIds})`);

      freshStats.forEach(stats => {
        const result: CachedBountyStats = {
          id: stats.id,
          voteCount: Number(stats.voteCount),
          commentCount: Number(stats.commentCount),
          updatedAt: stats.updatedAt,
        };

        bountyStatsCache.set(stats.id, {
          data: result,
          expires: now + CACHE_TTL,
        });

        results.push(result);
      });
    } catch (error) {
      console.error('Failed to fetch bounty stats batch:', error);
    }
  }

  return results;
}

export function invalidateBountyCache(bountyId: string): void {
  bountyStatsCache.delete(bountyId);
  bountyDetailsCache.delete(bountyId);
}

export function clearExpiredCache(): void {
  const now = Date.now();

  for (const [key, value] of bountyStatsCache.entries()) {
    if (now >= value.expires) {
      bountyStatsCache.delete(key);
    }
  }

  for (const [key, value] of bountyDetailsCache.entries()) {
    if (now >= value.expires) {
      bountyDetailsCache.delete(key);
    }
  }
}

// Clear expired cache every 10 minutes
setInterval(clearExpiredCache, 10 * 60 * 1000);