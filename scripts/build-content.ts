/**
 * 构建时脚本：读取 content/posts/*.md 与 content/categories.json，
 * 输出 public/data/posts.json 供前端使用。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

interface BuildPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content');
const postsDir = path.join(contentDir, 'posts');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

let categories: CategoryItem[] = [];
const categoriesPath = path.join(contentDir, 'categories.json');
if (fs.existsSync(categoriesPath)) {
  categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')) as CategoryItem[];
}
fs.writeFileSync(
  path.join(publicDataDir, 'categories.json'),
  JSON.stringify(categories, null, 2),
  'utf-8'
);

const postFiles = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir).filter((f: string) => f.endsWith('.md'))
  : [];

const posts: BuildPost[] = postFiles.map((file: string) => {
  const fullPath = path.join(postsDir, file);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data: frontmatter, content } = matter(raw) as { data: Record<string, string>; content: string };
  const slug = frontmatter.slug ?? path.basename(file, '.md');
  const html = marked.parse(content, { async: false }) as string;
  return {
    slug,
    title: frontmatter.title ?? slug,
    date: frontmatter.date ?? '',
    category: frontmatter.category ?? '',
    excerpt: frontmatter.excerpt ?? content.slice(0, 160).replace(/\n/g, ' '),
    content: html,
  };
});

posts.sort((a, b) => (b.date < a.date ? -1 : 1));

fs.writeFileSync(
  path.join(publicDataDir, 'posts.json'),
  JSON.stringify(posts, null, 2),
  'utf-8'
);

console.log('Content built: %d posts, %d categories', posts.length, categories.length);
