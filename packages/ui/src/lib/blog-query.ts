import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type {
	MarbleAuthorList,
	MarbleCategoryList,
	MarblePost,
	MarblePostList,
	MarbleTagList,
} from "@bounty/types";

const url = process.env.NEXT_PUBLIC_MARBLE_API_URL;
const key = process.env.MARBLE_WORKSPACE_KEY;

async function fetchFromMarble<T>(
	endpoint: string,
	tags: string[],
): Promise<T | undefined> {
	if (!(url && key)) {
		console.warn(
			"Missing NEXT_PUBLIC_MARBLE_API_URL or MARBLE_WORKSPACE_KEY in environment variables",
		);
		return;
	}

	try {
		const response = await fetch(`${url}/${key}/${endpoint}`, {
			cache: "force-cache",
			next: {
				tags,
			},
		} as RequestInit & { next?: { tags?: string[] } });

		if (!response.ok) {
			throw new Error(
				`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`,
			);
		}

		return (await response.json()) as T;
	} catch (error) {
		console.error(`Error fetching ${endpoint}:`, error);
		return;
	}
}

export async function getPosts(): Promise<MarblePostList | undefined> {
	return await fetchFromMarble<MarblePostList>("posts", ["posts"]);
}

export async function getTags(): Promise<MarbleTagList | undefined> {
	return await fetchFromMarble<MarbleTagList>("tags", ["tags"]);
}

export async function getSinglePost(
	slug: string,
): Promise<MarblePost | undefined> {
	if (!slug || slug === "undefined") {
		return;
	}

	return await fetchFromMarble<MarblePost>(`posts/${slug}`, ["posts", slug]);
}

export async function getCategories(): Promise<MarbleCategoryList | undefined> {
	return await fetchFromMarble<MarbleCategoryList>("categories", [
		"categories",
	]);
}

export async function getAuthors(): Promise<MarbleAuthorList | undefined> {
	return await fetchFromMarble<MarbleAuthorList>("authors", ["authors"]);
}

export async function processHtmlContent(html: string): Promise<string> {
	const processor = unified()
		.use(rehypeSanitize)
		.use(rehypeParse, { fragment: true })
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings, { behavior: "append" })
		.use(rehypeStringify);

	const file = await processor.process(html);
	return String(file);
}
