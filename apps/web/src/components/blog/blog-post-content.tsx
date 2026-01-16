'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import Link from '@bounty/ui/components/link';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Prose from '@/components/prose';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import type { Post } from '@/types/post';

interface BlogPostContentProps {
  post: Post;
  processedContent: string;
}

export function BlogPostContent({
  post,
  processedContent,
}: BlogPostContentProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <section className="relative overflow-hidden pt-32 pb-16">
        {post.coverImage && post.coverImage.trim() !== '' && (
          <>
            <Image
              alt={post.title}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-full w-full object-cover object-center opacity-40 mix-blend-screen blur-[2px]"
              fill
              loading="lazy"
              src={post.coverImage}
              style={{ color: 'transparent' }}
            />
            <div
              className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)',
              }}
            />
          </>
        )}

        <div className="relative z-20 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <Link
              className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              href="/blog"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="font-light text-4xl leading-[0.9] tracking-tighter md:text-6xl">
                  {post.title}
                </h1>

                <p className="max-w-3xl font-light text-white/60 text-xl leading-relaxed">
                  {post.description}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-4 border-white/10 border-t pt-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  {post.authors && post.authors.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/20">
                        <AvatarImage
                          alt={post.authors[0].name}
                          src={post.authors[0].image}
                        />
                        <AvatarFallback className="bg-white/10 text-sm text-white">
                          {post.authors[0].name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-medium text-sm text-white">
                          {post.authors[0].name}
                        </p>
                        <div className="flex items-center gap-4 text-white/50 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {(post.publishedAt instanceof Date
                                ? post.publishedAt
                                : new Date(post.publishedAt)
                              ).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {post.tags.map((tag) => (
                      <Badge
                        className="border-white/20 bg-transparent text-white/70 text-xs hover:bg-white/5"
                        key={tag.id}
                        variant="outline"
                      >
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

      <section className="bg-[#0a0a0a] py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Prose
            className="prose-invert prose-lg max-w-none prose-blockquote:border-white/20 prose-hr:border-white/20 prose-a:text-blue-400 prose-blockquote:text-white/70 prose-code:text-blue-300 prose-headings:text-white prose-p:text-white/80 prose-strong:text-white"
            html={processedContent}
          />
        </div>
      </section>

      <section className="relative bg-[#0a0a0a] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 text-center">
            <h2 className="font-light text-3xl leading-tight tracking-tight md:text-4xl">
              Ready to ship faster?
            </h2>
            <p className="text-white/50 leading-relaxed">
              Join the waitlist and be among the first to experience the new way
              to collaborate, create, and get paid for exceptional work.
            </p>
            <Button
              className="h-10 rounded-lg bg-white px-8 font-medium text-black transition-all duration-200 hover:bg-white/90"
              onClick={() => {
                router.push('/?waitlist=true');
              }}
            >
              Join Waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
