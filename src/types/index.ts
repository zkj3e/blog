export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface PostTocItem {
  depth: number;
  text: string;
  id: string;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  toc: PostTocItem[];
}
