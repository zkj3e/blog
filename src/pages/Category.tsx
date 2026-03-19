import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPosts, getCategories } from '../data';
import { formatDate } from '../utils/format';
import type { Post, Category as CategoryType } from '../types';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPosts(), getCategories()])
      .then(([allPosts, cats]) => {
        setCategories(cats);
        setPosts(allPosts.filter((p) => p.category === id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const cat = categories.find((c) => c.id === id);

  if (loading) {
    return <div className="py-8 text-gray-500 dark:text-gray-400">加载中…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        {cat ? cat.name : id}
        {cat?.description && (
          <span className="font-normal text-gray-500 dark:text-gray-400 text-base"> — {cat.description}</span>
        )}
      </h1>
      <ul className="list-none p-0 m-0">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-gray-200 dark:border-gray-800 py-4 first:pt-0">
            <Link to={`/post/${post.slug}`} className="block no-underline hover:no-underline">
              <span className="block font-semibold text-gray-900 dark:text-gray-100">{post.title}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">{formatDate(post.date)}</span>
            </Link>
            {post.excerpt && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{post.excerpt}</p>
            )}
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="text-gray-500 dark:text-gray-400">该分类下暂无文章</p>}
    </div>
  );
}
