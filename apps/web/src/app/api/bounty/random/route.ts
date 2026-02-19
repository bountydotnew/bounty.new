import { type NextRequest, NextResponse } from "next/server";
import { db } from "@bounty/db";

export async function GET(request: NextRequest) {
	try {
		// Use relational query API to avoid drizzle-orm type conflicts
		const allOpenBounties = await db.query.bounty.findMany({
			columns: {
				id: true,
			},
			where: (fields, { eq }) => eq(fields.status, "open"),
		});

		// Pick a random one
		const randomBounty =
			allOpenBounties[Math.floor(Math.random() * allOpenBounties.length)];

		if (randomBounty?.id) {
			return NextResponse.redirect(
				new URL(`/bounty/${randomBounty.id}`, request.url),
			);
		}

		return NextResponse.redirect(new URL("/bounties", request.url));
	} catch (error) {
		console.error("[Random Bounty API] Error:", error);
		return NextResponse.redirect(new URL("/bounties", request.url));
	}
}
