import { getPosts } from '@bounty/ui/lib/blog-query';
import type { Post } from '@/types/post';
import { BlogPageContent } from '@/components/blog/blog-page-content';

export default async function BlogPage() {
  const postsData = await getPosts();

  if (!postsData?.posts) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-white">
        Error loading blog posts. Please try again later.
      </div>
    );
  }

  return <BlogPageContent posts={postsData.posts} />;
}
