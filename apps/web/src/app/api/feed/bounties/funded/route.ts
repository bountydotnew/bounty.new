import { db, bounty, user } from "@bounty/db";
import { desc, eq, inArray, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Cache the feed for 5 minutes
const getCachedFundedBounties = unstable_cache(
	async () => {
		const bounties = await db
			.select({
				id: bounty.id,
				title: bounty.title,
				description: bounty.description,
				amount: bounty.amount,
				currency: bounty.currency,
				createdAt: bounty.createdAt,
				creatorId: bounty.createdById,
				repositoryUrl: bounty.repositoryUrl,
				issueUrl: bounty.issueUrl,
				paymentStatus: bounty.paymentStatus,
			})
			.from(bounty)
			.where(or(eq(bounty.status, "open"), eq(bounty.status, "in_progress")))
			.orderBy(desc(bounty.createdAt))
			.limit(50);

		// Filter to only funded bounties (held or released)
		const fundedBounties = bounties.filter(
			(b) => b.paymentStatus === "held" || b.paymentStatus === "released",
		);

		// Fetch creator info for each bounty
		const creatorIds = [...new Set(fundedBounties.map((b) => b.creatorId))];
		const creators =
			creatorIds.length > 0
				? await db
						.select({
							id: user.id,
							name: user.name,
							handle: user.handle,
						})
						.from(user)
						.where(inArray(user.id, creatorIds))
				: [];

		// Create a map for quick lookup
		const creatorMap = new Map(creators.map((c) => [c.id, c]));

		return fundedBounties.map((b) => ({
			...b,
			creator: creatorMap.get(b.creatorId) || { name: null, handle: null },
		}));
	},
	["bounty-feed-funded"],
	{
		revalidate: 300, // 5 minutes
	},
);

function formatRSSDate(date: Date): string {
	return date.toUTCString();
}

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function GET() {
	try {
		const bounties = await getCachedFundedBounties();
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

		const rssItems = bounties
			.map((bounty) => {
				const bountyUrl = `${baseUrl}/bounty/${bounty.id}`;
				const title = `$${bounty.amount} ${bounty.currency} - ${bounty.title}`;
				const description = bounty.description || "";
				const creatorName =
					bounty.creator.name || bounty.creator.handle || "Unknown";
				const pubDate = formatRSSDate(bounty.createdAt);

				let itemContent = `<title>${escapeXml(title)}</title>
<link>${escapeXml(bountyUrl)}</link>
<guid isPermaLink="true">${escapeXml(bountyUrl)}</guid>
<pubDate>${pubDate}</pubDate>
<description>${escapeXml(description.slice(0, 500))}</description>`;

				if (bounty.repositoryUrl) {
					itemContent += `\n<category>Repository: ${escapeXml(bounty.repositoryUrl)}</category>`;
				}

				if (bounty.issueUrl) {
					itemContent += `\n<category>Issue: ${escapeXml(bounty.issueUrl)}</category>`;
				}

				itemContent += `\n<category>Creator: ${escapeXml(creatorName)}</category>`;
				itemContent += `\n<category>Status: Funded</category>`;

				return `<item>\n${itemContent}\n</item>`;
			})
			.join("\n");

		const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>bounty.new - Funded Bounties</title>
    <link>${baseUrl}/bounties</link>
    <description>Latest funded bounties from bounty.new</description>
    <language>en-US</language>
    <lastBuildDate>${formatRSSDate(new Date())}</lastBuildDate>
    <atom:link href="${baseUrl}/api/feed/bounties/funded" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

		return new Response(rss, {
			headers: {
				"Content-Type": "application/rss+xml; charset=utf-8",
				"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
			},
		});
	} catch (error) {
		console.error("Error generating funded bounties RSS feed:", error);
		return new Response("Error generating feed", { status: 500 });
	}
}
