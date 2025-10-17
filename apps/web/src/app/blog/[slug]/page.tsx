import { getSinglePost, processHtmlContent } from '@bounty/ui/lib/blog-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BlogPostContent } from '@/components/blog/blog-post-content';
import type { Post } from '@/types/post';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function BlogPostSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="animate-pulse space-y-8">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="space-y-4">
            <div className="h-12 w-3/4 rounded bg-white/10" />
            <div className="h-6 w-full rounded bg-white/10" />
            <div className="h-6 w-5/6 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function BlogPost({ slug }: { slug: string }) {
  try {
    const postData = await getSinglePost(slug);
    const { post } = postData;

    const processedContent = await processHtmlContent(post.content);

    return <BlogPostContent post={post as Post} processedContent={processedContent} />;
  } catch (_error) {
    notFound();
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPost slug={slug} />
    </Suspense>
  );
}
