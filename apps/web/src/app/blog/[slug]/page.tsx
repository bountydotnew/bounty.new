import type { Metadata } from 'next';
import {
  getSinglePost,
  getPosts,
  processHtmlContent,
} from '@bounty/ui/lib/blog-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BlogPostContent } from '@/components/blog/blog-post-content';
import type { Post } from '@/types/post';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const postData = await getSinglePost(slug);
  if (!postData?.post) {
    return { title: 'Post Not Found' };
  }
  return {
    title: postData.post.title,
    description:
      postData.post.description ||
      `Read "${postData.post.title}" on the bounty.new blog.`,
  };
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BlogPostSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 pt-24 pb-20">
        <div className="animate-pulse space-y-8">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="space-y-4">
            <div className="h-12 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-48 rounded bg-white/10" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function BlogPost({ slug }: { slug: string }) {
  const [postData, postsData] = await Promise.all([
    getSinglePost(slug),
    getPosts(),
  ]);

  if (!postData?.post) {
    notFound();
  }

  const { post } = postData;
  const processedContent = await processHtmlContent(post.content);

  // Find prev/next posts
  let prevPost: { slug: string; title: string } | null = null;
  let nextPost: { slug: string; title: string } | null = null;

  if (postsData?.posts) {
    const currentIndex = postsData.posts.findIndex((p) => p.slug === slug);
    if (currentIndex > 0) {
      const prev = postsData.posts[currentIndex - 1];
      nextPost = { slug: prev.slug, title: prev.title };
    }
    if (currentIndex < postsData.posts.length - 1) {
      const next = postsData.posts[currentIndex + 1];
      prevPost = { slug: next.slug, title: next.title };
    }
  }

  return (
    <BlogPostContent
      post={post as Post}
      processedContent={processedContent}
      prevPost={prevPost}
      nextPost={nextPost}
    />
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPost slug={slug} />
    </Suspense>
  );
}
