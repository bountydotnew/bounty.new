'use client';

import Link from '@bounty/ui/components/link';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
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
  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />

      {/* Section with Cursor-style spacing: pt-32 (v5) + px-8 (g2) */}
      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Title */}
          <div className="mb-12">
            <h1 className="font-display text-5xl tracking-tight text-[#efefef]">
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
                          ? 'text-[#666] hover:text-[#efefef]'
                          : 'text-[#efefef]'
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
                            ? 'text-[#efefef]'
                            : 'text-[#666] hover:text-[#efefef]'
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
                  <p className="text-[#666]">No posts yet. Check back soon.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="group">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block rounded-xl border border-transparent bg-[#0E0E0E] px-6 py-5 transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                    >
                      <h3 className="mb-1.5 text-[15px] font-medium text-[#efefef] transition-colors duration-200 group-hover:text-white">
                        {post.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-[15px] leading-relaxed text-[#888]">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[14px] text-[#666]">
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
