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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      <section className="relative pt-32 pb-16 overflow-hidden">
        <Image
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={960}
          height={860}
          decoding="async"
          data-nimg="1"
          className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-full w-full object-cover object-right-bottom opacity-40 blur-[2px] mix-blend-screen"
          style={{ color: "transparent" }}
          src="/landing-page-bg.png"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 my-10">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-[0.9]">
                Latest
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-white to-green-400 bg-clip-text text-transparent font-medium">
                  Updates
                  <span className="ml-2 italic font-normal font-serif">
                    & insights.
                  </span>
                </span>
              </h1>
              <p className="text-xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
                Stay up to date with the latest features, tutorials, and
                insights from the bounty.new team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="space-y-4">
                <h3 className="text-2xl font-light text-white/70">
                  No posts yet
                </h3>
                <p className="text-white/50">
                  Check back soon for updates and insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full pt-0 hover:shadow-lg transition-shadow overflow-hidden">
                    {post.coverImage && (
                      <div className="relative aspect-video overflow-hidden rounded-xl">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <CardContent className="p-6">
                      {post.authors && post.authors.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          {post.authors.map((author, index) => (
                            <div
                              key={author.id}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage
                                  src={author.image}
                                  alt={author.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {author.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {author.name}
                              </span>
                              {index < post.authors.length - 1 && (
                                <span className="text-muted-foreground">•</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <h2 className="text-xl font-semibold mb-2">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {post.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative py-20 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight">
              Ready to ship faster?
            </h2>
            <p className="text-white/50 leading-relaxed">
              Join the waitlist and be among the first to experience the new way
              to collaborate, create, and get paid for exceptional work.
            </p>
            <Button className="bg-white text-black hover:bg-white/90 h-10 px-8 font-medium rounded-lg transition-all duration-200">
              Join Waitlist
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
