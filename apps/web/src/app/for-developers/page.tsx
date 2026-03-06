import type { Metadata } from 'next';
import { getSinglePost, processHtmlContent } from '@bounty/ui/lib/blog-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ForDevelopersContent } from './page-client';
import type { Post } from '@/types/post';

const SLUG = 'for-developers';

export const metadata: Metadata = {
  title: 'For Developers | bounty.new',
  description:
    'Ship code, get paid. Find scoped bounties from real maintainers, submit work you understand, and earn money for merge-worthy contributions.',
};

async function ForDevelopersPost() {
  const postData = await getSinglePost(SLUG);

  if (!postData?.post) {
    notFound();
  }

  const { post } = postData;
  const processedContent = await processHtmlContent(post.content);

  return (
    <ForDevelopersContent
      post={post as Post}
      processedContent={processedContent}
    />
  );
}

function ForDevelopersSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pt-32 pb-20">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="space-y-3 pt-8">
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-4/6 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForDevelopersPage() {
  return (
    <Suspense fallback={<ForDevelopersSkeleton />}>
      <ForDevelopersPost />
    </Suspense>
  );
}
