import { getPosts, getCategories } from '@bounty/ui/lib/blog-query';
import { BlogPageContent } from '@/components/blog/blog-page-content';
import { notFound } from 'next/navigation';

interface TopicPageProps {
  params: Promise<{
    topic: string;
  }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { topic } = await params;

  const [postsData, categoriesData] = await Promise.all([
    getPosts(),
    getCategories(),
  ]);

  if (!postsData?.posts || !categoriesData?.categories) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-foreground">
        Error loading blog posts. Please try again later.
      </div>
    );
  }

  // Check if the category exists
  const categoryExists = categoriesData.categories.some(
    (cat) => cat.slug === topic
  );

  if (!categoryExists) {
    notFound();
  }

  // Filter posts by category
  const filteredPosts = postsData.posts.filter(
    (post) => post.category?.slug === topic
  );

  return (
    <BlogPageContent
      posts={filteredPosts}
      categories={categoriesData.categories}
      activeCategory={topic}
    />
  );
}
