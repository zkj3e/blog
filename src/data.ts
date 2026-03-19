import type { Category, Post } from './types';

const base = import.meta.env.BASE_URL;

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${base}data/categories.json`);
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${base}data/posts.json`);
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
