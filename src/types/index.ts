export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
}
