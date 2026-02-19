import { auth } from "@bounty/auth/server";
import { db, waitlist } from "@bounty/db";
import { track } from "@bounty/track";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";

export async function POST(_request: NextRequest) {
	try {
		// Check for authenticated session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{
					error: "Must be logged in to join waitlist",
					success: false,
				},
				{ status: 401 },
			);
		}

		const userId = session.user.id;
		const userEmail = session.user.email;

		if (!userEmail) {
			return NextResponse.json(
				{
					error: "User email is required",
					success: false,
				},
				{ status: 400 },
			);
		}

		// Check if user already has a waitlist entry (by userId or email)
		const existingEntry = await db.query.waitlist.findFirst({
			where: (fields, { eq, or }) =>
				or(eq(fields.userId, userId), eq(fields.email, userEmail)),
		});

		if (existingEntry) {
			// Update the entry with userId if not already set
			if (!existingEntry.userId) {
				await db
					.update(waitlist)
					.set({ userId })
					.where(eq(waitlist.id, existingEntry.id));
			}

			return NextResponse.json({
				success: true,
				message: "You're already on the waitlist!",
				alreadyJoined: true,
			});
		}

		// Calculate position
		const allEntries = await db.query.waitlist.findMany();
		const position = allEntries.length + 1;

		// Create new waitlist entry linked to user
		await db.insert(waitlist).values({
			email: userEmail,
			userId,
			createdAt: new Date(),
			position,
		});

		await track("waitlist_joined", { source: "api", userId });
		return NextResponse.json({
			success: true,
			message: "Successfully added to waitlist!",
			position,
		});
	} catch (_error) {
		return NextResponse.json(
			{
				error: "Database temporarily unavailable",
				success: false,
			},
			{ status: 500 },
		);
	}
}
