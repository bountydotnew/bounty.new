'use client';

import Link from '@bounty/ui/components/link';
import Prose from '@/components/prose';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { formatDate } from '@bounty/ui/lib/utils';
import type { Post } from '@/types/post';

interface ForDevelopersContentProps {
  post: Post;
  processedContent: string;
}

export function ForDevelopersContent({
  post,
  processedContent,
}: ForDevelopersContentProps) {
  const authorName = post.authors?.[0]?.name ?? 'Team';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-3xl">
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
              {' by '}
              <span className="text-text-muted">{authorName}</span>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-text-secondary prose-p:leading-[1.8] prose-a:text-inherit prose-a:underline prose-a:decoration-[#555] hover:prose-a:decoration-[#888] prose-strong:text-foreground prose-blockquote:border-l-[#333] prose-blockquote:pl-6 prose-blockquote:text-text-muted prose-blockquote:italic prose-code:text-text-muted prose-pre:bg-background prose-pre:border prose-pre:border-border-subtle prose-hr:border-border-subtle prose-img:rounded-xl prose-figcaption:text-text-muted prose-figcaption:text-center prose-li:text-text-secondary">
            <Prose html={processedContent} />
          </div>

          {/* CTA */}
          <div className="mt-16 border-t border-border-subtle pt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl tracking-tight text-foreground">
                  Ready to start?
                </h2>
                <p className="mt-1 text-[15px] text-text-muted">
                  Browse open bounties and find work that matches your skills.
                </p>
              </div>
              <Link
                href="/bounties"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Browse Bounties
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
