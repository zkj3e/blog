import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mountInteractiveDemos } from '../components/demos/registry';
import { getPostBySlug } from '../data';
import { formatDate } from '../utils/format';
import type { Post as PostType } from '../types';

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post || !contentRef.current) return;
    const cleanups = mountInteractiveDemos(contentRef.current);

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [post]);

  if (loading) {
    return <div className="py-8 text-gray-500 dark:text-gray-400">加载中…</div>;
  }

  if (!post) {
    return (
      <div>
        <p>文章未找到</p>
        <Link to="/">返回首页</Link>
      </div>
    );
  }

  return (
    <article>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{post.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(post.date)} {post.category ? `· ${post.category}` : ''}
        </p>
      </header>
      {post.toc.length > 0 ? (
        <nav
          aria-label="文章目录"
          className="mb-8 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            目录
          </p>
          <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
            {post.toc.map((item) => (
              <li
                key={item.id}
                className={
                  item.depth === 2
                    ? ''
                    : item.depth === 3
                      ? 'pl-4'
                      : 'pl-8'
                }
              >
                <a href={`#${item.id}`} className="no-underline hover:underline">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div
        ref={contentRef}
        className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-code:font-mono [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24 [&_h5]:scroll-mt-24 [&_h6]:scroll-mt-24"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <p className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-8">
        <Link to="/">← 返回列表</Link>
      </p>
    </article>
  );
}
