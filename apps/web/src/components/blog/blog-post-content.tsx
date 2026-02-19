"use client";

import Link from "@bounty/ui/components/link";
import Prose from "@/components/prose";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { formatDate } from "@bounty/ui/lib/utils";
import type { Post } from "@/types/post";

interface BlogPostContentProps {
	post: Post;
	processedContent: string;
	prevPost?: { slug: string; title: string } | null;
	nextPost?: { slug: string; title: string } | null;
}

export function BlogPostContent({
	post,
	processedContent,
	prevPost,
	nextPost,
}: BlogPostContentProps) {
	const authorName = post.authors?.[0]?.name ?? "Team";

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Header />

			{/* Section with Cursor-style spacing */}
			<section className="flex-1 px-8 pt-32 pb-24">
				<div className="mx-auto max-w-6xl">
					<article className="grid grid-cols-1 gap-12 xl:grid-cols-[180px_1fr]">
						{/* Breadcrumb - sticky on desktop */}
						<div className="hidden xl:block">
							<div className="sticky top-32">
								<nav className="text-[15px]">
									<Link
										href="/blog"
										className="text-text-muted transition-colors duration-150 hover:text-foreground"
									>
										Blog
									</Link>
									<span className="text-text-muted"> / </span>
									{post.category && (
										<Link
											href={`/topic/${post.category.slug}`}
											className="capitalize text-text-muted transition-colors duration-150 hover:text-foreground"
										>
											{post.category.name}
										</Link>
									)}
								</nav>
							</div>
						</div>

						{/* Main content column */}
						<div className="max-w-3xl">
							{/* Mobile breadcrumb */}
							<nav className="mb-8 text-[15px] xl:hidden">
								<Link
									href="/blog"
									className="text-text-muted transition-colors duration-150 hover:text-foreground"
								>
									Blog
								</Link>
								<span className="text-text-muted"> / </span>
								{post.category && (
									<Link
										href={`/topic/${post.category.slug}`}
										className="capitalize text-text-muted transition-colors duration-150 hover:text-foreground"
									>
										{post.category.name}
									</Link>
								)}
							</nav>

							{/* Header */}
							<header className="mb-12">
								<h1 className="text-balance font-display text-4xl tracking-tight text-foreground md:text-5xl">
									{post.title}
								</h1>
								<div className="mt-5 text-[15px] text-text-muted">
									<time
										dateTime={
											post.publishedAt instanceof Date
												? post.publishedAt.toISOString()
												: new Date(post.publishedAt).toISOString()
										}
									>
										{formatDate(post.publishedAt)}
									</time>
									{" by "}
									<span className="text-text-muted">{authorName}</span>
									{post.category && (
										<span className="xl:hidden">
											{" in "}
											<Link
												href={`/topic/${post.category.slug}`}
												className="capitalize text-text-muted transition-colors duration-150 hover:text-foreground"
											>
												{post.category.name}
											</Link>
										</span>
									)}
								</div>
							</header>

							{/* Content */}
							<div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-text-secondary prose-p:leading-[1.8] prose-a:text-inherit prose-a:underline prose-a:decoration-[#555] hover:prose-a:decoration-[#888] prose-strong:text-foreground prose-blockquote:border-l-[#333] prose-blockquote:pl-6 prose-blockquote:text-text-muted prose-blockquote:italic prose-code:text-text-muted prose-pre:bg-background prose-pre:border prose-pre:border-border-subtle prose-hr:border-border-subtle prose-img:rounded-xl prose-figcaption:text-text-muted prose-figcaption:text-center prose-li:text-text-secondary">
								<Prose html={processedContent} />
							</div>

							{/* Footer */}
							<footer className="mt-16 border-t border-border-subtle pt-8">
								{post.category && (
									<p className="text-[15px]">
										<span className="text-text-muted">Filed under: </span>
										<Link
											href={`/topic/${post.category.slug}`}
											className="capitalize text-foreground transition-colors duration-150 hover:text-foreground"
										>
											{post.category.name}
										</Link>
									</p>
								)}
								<p className="text-[15px] text-text-muted">
									Author: {authorName}
								</p>
							</footer>
						</div>
					</article>

					{/* Navigation */}
					{(prevPost || nextPost) && (
						<nav className="mt-16 grid grid-cols-1 gap-4 xl:grid-cols-[180px_1fr]">
							<div className="hidden xl:block" />
							<div className="flex max-w-3xl gap-4">
								{prevPost && (
									<Link
										href={`/blog/${prevPost.slug}`}
										className="group flex flex-1 flex-col rounded-xl border border-transparent px-6 py-5 text-left transition-all duration-200 hover:border-border-subtle hover:bg-background"
									>
										<span className="text-[14px] text-text-muted">
											← Previous post
										</span>
										<span className="text-[15px] text-foreground transition-colors duration-200 group-hover:text-foreground">
											{prevPost.title}
										</span>
									</Link>
								)}
								{nextPost && (
									<Link
										href={`/blog/${nextPost.slug}`}
										className="group flex flex-1 flex-col rounded-xl border border-transparent px-6 py-5 text-right transition-all duration-200 hover:border-border-subtle hover:bg-background"
									>
										<span className="text-[14px] text-text-muted">
											Next post →
										</span>
										<span className="text-[15px] text-foreground transition-colors duration-200 group-hover:text-foreground">
											{nextPost.title}
										</span>
									</Link>
								)}
							</div>
						</nav>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
