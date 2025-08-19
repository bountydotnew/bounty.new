import { getPosts } from "@/lib/blog-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/sections/home/header";
import { Footer } from "@/components/sections/home/footer";

export default async function BlogPage() {
  const postsData = await getPosts();
  const { posts } = postsData;

  if (!posts) {
    return <div>Error loading blog posts. Please try again later.</div>;
  }

  return (
    <>
      {/* Full viewport background container */}
      <div 
        className="fixed inset-0 w-full h-full -z-10"
      />
      
      {/* Content container */}
      <div className="min-h-screen text-white relative">
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="153"
          height="179"
          viewBox="0 0 153 179"
          fill="none"
          className="absolute top-0 -right-[35rem] z-0 transition-transform duration-300 ease-out desktop-svg md:opacity-20 lg:opacity-10 opacity-10"
          style={{
            width: "75rem",
            height: "75rem",
          }}
        >
          <path
            d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
            stroke="url(#paint0_linear_34_3652)"
            strokeWidth="21.3696"
          />
          <defs>
            <linearGradient
              id="paint0_linear_34_3652"
              x1="35.4019"
              y1="-16.1847"
              x2="150.598"
              y2="205.685"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(239, 239, 239, 1)" />
              <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Header />

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        {/* Hero Section */}
        <div className="max-w-4xl mb-20">
          <h1 className="text-7xl mb-8 leading-tight font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
            Latest.
            <br />
            Updates & insights.
          </h1>

          <p className="text-xl mb-12 max-w-2xl font-display-book leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
            Stay up to date with the latest features, tutorials, and insights from the bounty.new team.
            Building in public, sharing knowledge.
          </p>
        </div>

        {/* Blog Posts Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold mb-12 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
            Recent Posts
          </h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-4">
                <h3 className="text-2xl font-display" style={{ color: "rgba(239, 239, 239, 0.7)" }}>
                  No posts yet
                </h3>
                <p className="font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
                  Check back soon for updates and insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article className="group border border-[#282828] rounded-2xl overflow-hidden hover:bg-white/5 transition-all">
                    {post.coverImage && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-8">
                      {post.authors && post.authors.length > 0 && (
                        <div className="flex items-center gap-3 mb-4">
                          {post.authors.map((author, index) => (
                            <div
                              key={author.id}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="w-8 h-8 ring-1 ring-[#282828]">
                                <AvatarImage
                                  src={author.image}
                                  alt={author.name}
                                />
                                <AvatarFallback className="text-xs font-display">
                                  {author.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-display-book" style={{ color: "rgba(146, 146, 146, 1)" }}>
                                {author.name}
                              </span>
                              {index < post.authors.length - 1 && (
                                <span style={{ color: "rgba(146, 146, 146, 1)" }}>•</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl font-bold mb-3 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
                        {post.title}
                      </h2>
                      <p className="font-display-book leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
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
          <div className="border border-[#282828] rounded-2xl p-12">
            <h2 className="text-4xl font-bold mb-6 font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
              Ready to ship faster?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto font-display-book leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
              Join the waitlist and be among the first to experience the new way
              to collaborate, create, and get paid for exceptional work.
            </p>
            <Button className="bg-white text-black hover:bg-white/90 h-12 px-8 font-display rounded-lg transition-all duration-200">
              Join Waitlist
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
}
