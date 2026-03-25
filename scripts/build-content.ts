/**
 * 构建时脚本：读取 content/posts/*.md 与 content/categories.json，
 * 输出 public/data/posts.json 供前端使用。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { lexer, walkTokens, Parser, Renderer } from 'marked';
import type { Token, Tokens } from 'marked';

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

interface TocItem {
  depth: number;
  text: string;
  id: string;
}

interface BuildPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  toc: TocItem[];
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function slugifyBase(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'section';
}

function nextSlugId(base: string, used: Map<string, number>): string {
  const n = used.get(base) ?? 0;
  used.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

/** 正文转 HTML，为 h2–h6 生成锚点 id；目录仅收录 h2–h4 */
function markdownToHtmlWithToc(markdown: string): { html: string; toc: TocItem[] } {
  const tokens = lexer(markdown);
  const headingIds: string[] = [];
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  walkTokens(tokens, (token: Token) => {
    if (token.type !== 'heading') return;
    const h = token as Tokens.Heading;
    if (h.depth < 2 || h.depth > 6) return;
    const id = nextSlugId(slugifyBase(h.text), used);
    headingIds.push(id);
    if (h.depth <= 4) {
      toc.push({ depth: h.depth, text: h.text, id });
    }
  });

  const renderer = new Renderer();
  let i = 0;
  renderer.heading = function (text: string, level: number, _raw: string) {
    if (level >= 2 && level <= 6 && i < headingIds.length) {
      const id = headingIds[i++];
      return `<h${level} id="${escapeHtmlAttr(id)}">${text}</h${level}>\n`;
    }
    return `<h${level}>${text}</h${level}>\n`;
  };

  const html = Parser.parse(tokens, { renderer });
  return { html, toc };
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
  const { html, toc } = markdownToHtmlWithToc(content);
  return {
    slug,
    title: frontmatter.title ?? slug,
    date: frontmatter.date ?? '',
    category: frontmatter.category ?? '',
    excerpt: frontmatter.excerpt ?? content.slice(0, 160).replace(/\n/g, ' '),
    content: html,
    toc,
  };
});

posts.sort((a, b) => (b.date < a.date ? -1 : 1));

fs.writeFileSync(
  path.join(publicDataDir, 'posts.json'),
  JSON.stringify(posts, null, 2),
  'utf-8'
);

console.log('Content built: %d posts, %d categories', posts.length, categories.length);
