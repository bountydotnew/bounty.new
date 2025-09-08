import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Footer } from '@/components/sections/home/footer';
import { Header } from '@/components/sections/home/header';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import Link from '@bounty/ui/components/link';
import { getPosts } from '@bounty/ui/lib/blog-query';

export default async function BlogPage() {
  const postsData = await getPosts();
  const { posts } = postsData;

  if (!posts) {
    return <div>Error loading blog posts. Please try again later.</div>;
  }

  return (
    <>
      {/* Full viewport background container */}
      <div className="-z-10 fixed inset-0 h-full w-full" />

      {/* Content container */}
      <div className="relative min-h-screen text-white">
        {/* Background geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="-right-[35rem] desktop-svg absolute top-0 z-0 opacity-10 transition-transform duration-300 ease-out md:opacity-20 lg:opacity-10"
            fill="none"
            height="179"
            style={{
              width: '75rem',
              height: '75rem',
            }}
            viewBox="0 0 153 179"
            width="153"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
              stroke="url(#paint0_linear_34_3652)"
              strokeWidth="21.3696"
            />
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear_34_3652"
                x1="35.4019"
                x2="150.598"
                y1="-16.1847"
                y2="205.685"
              >
                <stop stopColor="rgba(239, 239, 239, 1)" />
                <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <Header />

        {/* Main content */}
        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-20">
          {/* Hero Section */}
          <div className="mb-20 max-w-4xl">
            <h1
              className="mb-8 font-display text-7xl leading-tight"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              Latest.
              <br />
              Updates & insights.
            </h1>

            <p
              className="mb-12 max-w-2xl font-display-book text-xl leading-relaxed"
              style={{ color: 'rgba(146, 146, 146, 1)' }}
            >
              Stay up to date with the latest features, tutorials, and insights
              from the bounty.new team. Building in public, sharing knowledge.
            </p>
          </div>

          {/* Blog Posts Section */}
          <section className="mb-20">
            <h2
              className="mb-12 font-bold font-display text-4xl"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              Recent Posts
            </h2>

            {posts.length === 0 ? (
              <div className="py-20 text-center">
                <div className="space-y-4">
                  <h3
                    className="font-display text-2xl"
                    style={{ color: 'rgba(239, 239, 239, 0.7)' }}
                  >
                    No posts yet
                  </h3>
                  <p
                    className="font-display-book"
                    style={{ color: 'rgba(146, 146, 146, 1)' }}
                  >
                    Check back soon for updates and insights.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {posts.map((post) => (
                  <Link href={`/blog/${post.slug}`} key={post.id}>
                    <article className="group overflow-hidden rounded-2xl border border-[#282828] transition-all hover:bg-white/5">
                      {post.coverImage && (
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            alt={post.title}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            fill
                            src={post.coverImage}
                          />
                        </div>
                      )}

                      <div className="p-8">
                        {post.authors && post.authors.length > 0 && (
                          <div className="mb-4 flex items-center gap-3">
                            {post.authors.map((author, index) => (
                              <div
                                className="flex items-center gap-2"
                                key={author.id}
                              >
                                <Avatar className="h-8 w-8 ring-1 ring-[#282828]">
                                  <AvatarImage
                                    alt={author.name}
                                    src={author.image}
                                  />
                                  <AvatarFallback className="font-display text-xs">
                                    {author.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className="font-display-book text-sm"
                                  style={{ color: 'rgba(146, 146, 146, 1)' }}
                                >
                                  {author.name}
                                </span>
                                {index < post.authors.length - 1 && (
                                  <span
                                    style={{ color: 'rgba(146, 146, 146, 1)' }}
                                  >
                                    •
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <h2
                          className="mb-3 font-bold font-display text-2xl"
                          style={{ color: 'rgba(239, 239, 239, 1)' }}
                        >
                          {post.title}
                        </h2>
                        <p
                          className="font-display-book leading-relaxed"
                          style={{ color: 'rgba(146, 146, 146, 1)' }}
                        >
                          {post.description}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <div className="rounded-2xl border border-[#282828] p-12">
              <h2
                className="mb-6 font-bold font-display text-4xl"
                style={{ color: 'rgba(239, 239, 239, 1)' }}
              >
                Ready to ship faster?
              </h2>
              <p
                className="mx-auto mb-8 max-w-2xl font-display-book text-xl leading-relaxed"
                style={{ color: 'rgba(146, 146, 146, 1)' }}
              >
                Join the waitlist and be among the first to experience the new
                way to collaborate, create, and get paid for exceptional work.
              </p>
              <Button className="h-12 rounded-lg bg-white px-8 font-display text-black transition-all duration-200 hover:bg-white/90">
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
