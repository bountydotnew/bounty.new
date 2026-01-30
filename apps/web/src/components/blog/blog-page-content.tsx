'use client';

import Link from '@bounty/ui/components/link';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { formatDate } from '@bounty/ui/lib/utils';
import type { Category, Post } from '@/types/post';

interface BlogPageContentProps {
  posts: Post[];
  categories: Category[];
  activeCategory?: string;
}

export function BlogPageContent({
  posts,
  categories,
  activeCategory,
}: BlogPageContentProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      {/* Section with Cursor-style spacing: pt-32 (v5) + px-8 (g2) */}
      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Title */}
          <div className="mb-12">
            <h1 className="font-display text-5xl tracking-tight text-foreground">
              Blog
            </h1>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[160px_1fr] lg:grid-cols-[180px_1fr]">
            {/* Left Sidebar: Categories */}
            <aside>
              <nav className="sticky top-32">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/blog"
                      className={`block py-1.5 text-[15px] capitalize transition-colors duration-150 ${
                        activeCategory
                          ? 'text-text-muted hover:text-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      all posts
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/topic/${category.slug}`}
                        className={`block py-1.5 text-[15px] capitalize transition-colors duration-150 ${
                          activeCategory === category.slug
                            ? 'text-foreground'
                            : 'text-text-muted hover:text-foreground'
                        }`}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Right Content: Post Cards */}
            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <div className="py-32 text-center">
                  <p className="text-text-muted">No posts yet. Check back soon.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="group">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block rounded-xl border border-transparent bg-background px-6 py-5 transition-all duration-200 hover:border-border-subtle hover:bg-background"
                    >
                      <h3 className="mb-1.5 text-[15px] font-medium text-foreground transition-colors duration-200 group-hover:text-foreground">
                        {post.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-[15px] leading-relaxed text-text-muted">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[14px] text-text-muted">
                        {post.category && (
                          <>
                            <span className="capitalize">
                              {post.category.name}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <time
                          dateTime={
                            post.publishedAt instanceof Date
                              ? post.publishedAt.toISOString()
                              : new Date(post.publishedAt).toISOString()
                          }
                        >
                          {formatDate(post.publishedAt)}
                        </time>
                      </div>
                    </Link>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
