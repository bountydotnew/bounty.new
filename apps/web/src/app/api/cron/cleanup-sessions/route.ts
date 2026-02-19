import { cleanupExpiredSessions, getExpiredSessionCount } from "@bounty/db";
import { env } from "@bounty/env/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Cron job to clean up expired sessions from the database
 * Runs daily at 2 AM UTC
 * Secured with CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
	// Verify cron secret for security
	const authHeader = request.headers.get("authorization");
	const cronSecret = env.CRON_SECRET;

	if (!cronSecret) {
		console.error("[Cron] CRON_SECRET environment variable is not set");
		return NextResponse.json(
			{ error: "Cron secret not configured" },
			{ status: 500 },
		);
	}

	if (authHeader !== `Bearer ${cronSecret}`) {
		console.warn("[Cron] Unauthorized cron job attempt");
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get count of expired sessions before cleanup
		const expiredCount = await getExpiredSessionCount();

		// Clean up expired sessions (no buffer - delete all expired)
		const deletedCount = await cleanupExpiredSessions(0);

		console.log(
			`[Cron] Cleaned up ${deletedCount} expired sessions (${expiredCount} were expired)`,
		);

		return NextResponse.json({
			success: true,
			deleted: deletedCount,
			expiredBeforeCleanup: expiredCount,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Cron] Error cleaning up expired sessions:", error);
		return NextResponse.json(
			{
				error: "Failed to clean up sessions",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
