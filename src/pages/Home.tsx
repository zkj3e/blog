import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getCategories } from '../data';
import { formatDate } from '../utils/format';
import type { Post, Category } from '../types';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPosts(), getCategories()])
      .then(([p, c]) => {
        setPosts(p);
        setCategories(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  if (loading) {
    return <div className="py-8 text-gray-500 dark:text-gray-400">加载中…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">最新文章</h1>
      <ul className="list-none p-0 m-0">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-gray-200 dark:border-gray-800 py-4 first:pt-0">
            <Link to={`/post/${post.slug}`} className="block no-underline hover:no-underline">
              <span className="block font-semibold text-gray-900 dark:text-gray-100">{post.title}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">
                {formatDate(post.date)} {post.category ? `· ${getCategoryName(post.category)}` : ''}
              </span>
            </Link>
            {post.excerpt && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{post.excerpt}</p>
            )}
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="text-gray-500 dark:text-gray-400">暂无文章</p>}
    </div>
  );
}
