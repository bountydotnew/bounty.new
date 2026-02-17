export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  description: string;
  coverImage: string;
  publishedAt: Date;
  updatedAt: Date;
  authors: {
    id: string;
    name: string;
    image: string;
  }[];
  category: {
    id: string;
    slug: string;
    name: string;
  };
  tags: {
    id: string;
    slug: string;
    name: string;
  }[];
  attribution: {
    author: string;
    url: string;
  } | null;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type MarbleTag = {
  tag: Tag;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

type MarbleCategory = {
  category: Category;
};

type Author = {
  id: string;
  name: string;
  image: string;
};

type MarbleAuthor = {
  author: Author;
};
