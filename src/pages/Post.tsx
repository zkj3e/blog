import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark-reasonable.min.css';
import { getPostBySlug } from '../data';
import { formatDate } from '../utils/format';
import type { Post as PostType } from '../types';

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!post || !articleRef.current) return;
    articleRef.current.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
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
    <article ref={articleRef}>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">{post.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(post.date)} {post.category ? `· ${post.category}` : ''}
        </p>
      </header>
      <div
        className="prose prose-gray dark:prose-invert max-w-none prose-pre:overflow-x-auto prose-code:font-mono"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <p className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-8">
        <Link to="/">← 返回列表</Link>
      </p>
    </article>
  );
}
