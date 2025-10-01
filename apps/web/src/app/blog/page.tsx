import { getPosts } from '@bounty/ui/lib/blog-query';
import type { Post } from '@/types/post';
import { BlogPageContent } from '@/components/blog/blog-page-content';

export default async function BlogPage() {
  let posts: Post[] = [];

  try {
    const postsData = await getPosts();
    posts = postsData?.posts ?? [];
  } catch (_error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-white">
        Error loading blog posts. Please try again later.
      </div>
    );
  }

  return <BlogPageContent posts={posts} />;
}
