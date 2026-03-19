import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../data';
import type { Category } from '../types';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center gap-6">
          <Link to="/" className="font-bold text-lg text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 no-underline">
            技术博客
          </Link>
          <nav className="flex gap-5 flex-1">
            <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              首页
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={theme === 'dark' ? '切换到浅色' : '切换到深色'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-6">
        {children}
      </main>
      <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
        © {new Date().getFullYear()} 技术总结 · React + Vite + TypeScript + Tailwind
      </footer>
    </div>
  );
}
