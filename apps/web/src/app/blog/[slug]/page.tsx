import { getSinglePost, processHtmlContent } from "@/lib/blog-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/sections/home/header";
import { Footer } from "@/components/sections/home/footer";
import Prose from "@/components/prose";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const postData = await getSinglePost(params.slug);
    const { post } = postData;
    
    const processedContent = await processHtmlContent(post.content);

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Header />
        
        <section className="relative pt-32 pb-16 overflow-hidden">
          {post.coverImage && post.coverImage.trim() !== '' && (
            <>
              <Image
                alt={post.title}
                aria-hidden="true"
                loading="lazy"
                fill
                className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-full w-full object-cover object-center opacity-40 blur-[2px] mix-blend-screen"
                style={{ color: "transparent" }}
                src={post.coverImage}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-10" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)" }} />
            </>
          )}
          
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="space-y-8">
              <Link href="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>

              <div className="space-y-6">
                <div className="space-y-4">
                  
                  <h1 className="text-4xl md:text-6xl font-light tracking-tighter leading-[0.9]">
                    {post.title}
                  </h1>
                  
                  <p className="text-xl text-white/60 font-light max-w-3xl leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    {post.authors && post.authors.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white/20">
                          <AvatarImage src={post.authors[0].image} alt={post.authors[0].name} />
                          <AvatarFallback className="bg-white/10 text-white text-sm">
                            {post.authors[0].name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-white font-medium text-sm">{post.authors[0].name}</p>
                          <div className="flex items-center gap-4 text-xs text-white/50">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="bg-transparent border-white/20 text-white/70 hover:bg-white/5 text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Prose 
              html={processedContent}
              className="prose-invert prose-lg prose-headings:text-white prose-p:text-white/80 prose-a:text-blue-400 prose-strong:text-white prose-code:text-blue-300 prose-blockquote:border-white/20 prose-blockquote:text-white/70 prose-hr:border-white/20 max-w-none"
            />
          </div>
        </section>

        <section className="relative py-20 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight">Ready to ship faster?</h2>
              <p className="text-white/50 leading-relaxed">
                Join the waitlist and be among the first to experience the new way to collaborate, create, and get paid
                for exceptional work.
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
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}
