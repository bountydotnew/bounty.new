import { auth } from "@bounty/auth/server";
import { account, db } from "@bounty/db";
import { eq, and } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/unlink-account
 *
 * Unlinks an OAuth provider from the user's account.
 * Body: { provider: 'github' | 'google' }
 */
export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: req.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { provider } = body;

		if (provider !== "github" && provider !== "google") {
			return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
		}

		// Check if user has other providers linked (including email)
		const userAccounts = await db.query.account.findMany({
			where: eq(account.userId, session.user.id),
			columns: {
				providerId: true,
			},
		});

		const hasOtherProvider = userAccounts.some(
			(a) => a.providerId !== provider,
		);

		if (!hasOtherProvider) {
			return NextResponse.json(
				{ error: "Cannot unlink last authentication method" },
				{ status: 400 },
			);
		}

		// Delete the account link
		await db
			.delete(account)
			.where(
				and(
					eq(account.userId, session.user.id),
					eq(account.providerId, provider),
				),
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error unlinking account:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
