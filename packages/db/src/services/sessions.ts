import { db } from "../index";
import { session } from "../schema/auth";
import { lt, sql } from "drizzle-orm";

/**
 * Clean up expired sessions from the database
 * @param bufferMinutes Optional buffer time in minutes to keep recently expired sessions (default: 0)
 * @returns Number of deleted sessions
 */
export async function cleanupExpiredSessions(
	bufferMinutes = 0,
): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setMinutes(cutoffDate.getMinutes() - bufferMinutes);

	const result = await db
		.delete(session)
		.where(lt(session.expiresAt, cutoffDate))
		.returning({ id: session.id });

	return result.length;
}

/**
 * Get count of expired sessions in the database
 * Useful for monitoring/alerting
 */
export async function getExpiredSessionCount(): Promise<number> {
	const result = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(session)
		.where(lt(session.expiresAt, sql`now()`));

	return result[0]?.count ?? 0;
}
