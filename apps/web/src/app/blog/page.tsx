import type { Metadata } from "next";
import { getPosts, getCategories } from "@bounty/ui/lib/blog-query";
import { BlogPageContent } from "@/components/blog/blog-page-content";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"Latest updates, articles, and insights from the bounty.new team.",
};

export default async function BlogPage() {
	const [postsData, categoriesData] = await Promise.all([
		getPosts(),
		getCategories(),
	]);

	if (!postsData?.posts) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-24 text-center text-foreground">
				Error loading blog posts. Please try again later.
			</div>
		);
	}

	return (
		<BlogPageContent
			posts={postsData.posts}
			categories={categoriesData?.categories ?? []}
		/>
	);
}
