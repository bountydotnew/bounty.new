'use client';

import Link from '@bounty/ui/components/link';
import Prose from '@/components/prose';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { formatDate } from '@bounty/ui/lib/utils';
import type { Post } from '@/types/post';

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
  const authorName = post.authors?.[0]?.name ?? 'Team';

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
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
                    className="text-[#666] transition-colors duration-150 hover:text-[#efefef]"
                  >
                    Blog
                  </Link>
                  <span className="text-[#444]"> / </span>
                  {post.category && (
                    <Link
                      href={`/topic/${post.category.slug}`}
                      className="capitalize text-[#666] transition-colors duration-150 hover:text-[#efefef]"
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
                  className="text-[#666] transition-colors duration-150 hover:text-[#efefef]"
                >
                  Blog
                </Link>
                <span className="text-[#444]"> / </span>
                {post.category && (
                  <Link
                    href={`/topic/${post.category.slug}`}
                    className="capitalize text-[#666] transition-colors duration-150 hover:text-[#efefef]"
                  >
                    {post.category.name}
                  </Link>
                )}
              </nav>

              {/* Header */}
              <header className="mb-12">
                <h1 className="text-balance font-display text-4xl tracking-tight text-[#efefef] md:text-5xl">
                  {post.title}
                </h1>
                <div className="mt-5 text-[15px] text-[#666]">
                  <time
                    dateTime={
                      post.publishedAt instanceof Date
                        ? post.publishedAt.toISOString()
                        : new Date(post.publishedAt).toISOString()
                    }
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                  {' by '}
                  <span className="text-[#888]">{authorName}</span>
                  {post.category && (
                    <span className="xl:hidden">
                      {' in '}
                      <Link
                        href={`/topic/${post.category.slug}`}
                        className="capitalize text-[#666] transition-colors duration-150 hover:text-[#efefef]"
                      >
                        {post.category.name}
                      </Link>
                    </span>
                  )}
                </div>
              </header>

              {/* Content */}
              <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-[#efefef] prose-p:text-[#b0b0b0] prose-p:leading-[1.8] prose-a:text-inherit prose-a:underline prose-a:decoration-[#555] hover:prose-a:decoration-[#888] prose-strong:text-[#efefef] prose-blockquote:border-l-[#333] prose-blockquote:pl-6 prose-blockquote:text-[#888] prose-blockquote:italic prose-code:text-[#888] prose-pre:bg-[#111] prose-pre:border prose-pre:border-[#222] prose-hr:border-[#222] prose-img:rounded-xl prose-figcaption:text-[#666] prose-figcaption:text-center prose-li:text-[#b0b0b0]">
                <Prose html={processedContent} />
              </div>

              {/* Footer */}
              <footer className="mt-16 border-t border-[#222] pt-8">
                {post.category && (
                  <p className="text-[15px]">
                    <span className="text-[#666]">Filed under: </span>
                    <Link
                      href={`/topic/${post.category.slug}`}
                      className="capitalize text-[#efefef] transition-colors duration-150 hover:text-white"
                    >
                      {post.category.name}
                    </Link>
                  </p>
                )}
                <p className="text-[15px] text-[#666]">Author: {authorName}</p>
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
                    className="group flex flex-1 flex-col rounded-xl border border-transparent px-6 py-5 text-left transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                  >
                    <span className="text-[14px] text-[#666]">
                      ← Previous post
                    </span>
                    <span className="text-[15px] text-[#efefef] transition-colors duration-200 group-hover:text-white">
                      {prevPost.title}
                    </span>
                  </Link>
                )}
                {nextPost && (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="group flex flex-1 flex-col rounded-xl border border-transparent px-6 py-5 text-right transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                  >
                    <span className="text-[14px] text-[#666]">Next post →</span>
                    <span className="text-[15px] text-[#efefef] transition-colors duration-200 group-hover:text-white">
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
