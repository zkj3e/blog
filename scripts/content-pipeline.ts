import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

export interface TocItem {
  depth: number;
  text: string;
  id: string;
}

export interface BuildPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  toc: TocItem[];
}

const DEMO_SHORTCODE_RE = /\{\{<\s*demo\s+([^>]+?)\s*>}}/g;
const DEMO_ATTR_RE = /([a-zA-Z][\w-]*)="([^"]*)"/g;

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseDemoAttributes(rawAttributes: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of rawAttributes.matchAll(DEMO_ATTR_RE)) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

export function preprocessMarkdown(markdown: string): string {
  return markdown.replace(DEMO_SHORTCODE_RE, (_, rawAttributes: string) => {
    const attributes = parseDemoAttributes(rawAttributes);
    const demoName = attributes.name?.trim();

    if (!demoName) {
      return '';
    }

    delete attributes.name;

    return `<div class="demo-embed" data-demo="${escapeHtmlAttribute(demoName)}" data-demo-props="${escapeHtmlAttribute(
      JSON.stringify(attributes)
    )}"></div>`;
  });
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';

  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractText).join('');
  }

  if ('alt' in node && typeof node.alt === 'string') {
    return node.alt;
  }

  return '';
}

function createTocPlugin(toc: TocItem[]) {
  return () => (tree: unknown) => {
    const slugger = new GithubSlugger();

    visit(tree, 'heading', (node: any) => {
      if (typeof node.depth !== 'number' || node.depth < 2 || node.depth > 6) {
        return;
      }

      const text = extractText(node).trim() || 'section';
      const id = slugger.slug(text);

      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.id = id;
      node.data.hProperties.id = id;

      if (node.depth <= 4) {
        toc.push({ depth: node.depth, text, id });
      }
    });
  };
}

export async function markdownToHtmlWithToc(markdown: string): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = [];
  const processedMarkdown = preprocessMarkdown(markdown);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(createTocPlugin(toc))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeHighlight, {
      ignoreMissing: true,
      plainText: ['txt', 'text'],
    })
    .use(rehypeStringify)
    .process(processedMarkdown);

  return { html: String(file), toc };
}

export async function buildPosts(postsDir: string): Promise<BuildPost[]> {
  const postFiles = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'))
    : [];

  const posts = await Promise.all(
    postFiles.map(async (file) => {
      const fullPath = path.join(postsDir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data: frontmatter, content } = matter(raw) as { data: Record<string, string>; content: string };
      const slug = frontmatter.slug ?? path.basename(file, '.md');
      const { html, toc } = await markdownToHtmlWithToc(content);

      return {
        slug,
        title: frontmatter.title ?? slug,
        date: frontmatter.date ?? '',
        category: frontmatter.category ?? '',
        excerpt: frontmatter.excerpt ?? content.slice(0, 160).replace(/\n/g, ' '),
        content: html,
        toc,
      };
    })
  );

  posts.sort((a, b) => (b.date < a.date ? -1 : 1));
  return posts;
}

export async function buildContentData(contentDir: string, publicDataDir: string): Promise<{
  categories: CategoryItem[];
  posts: BuildPost[];
}> {
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

  const posts = await buildPosts(path.join(contentDir, 'posts'));
  fs.writeFileSync(path.join(publicDataDir, 'posts.json'), JSON.stringify(posts, null, 2), 'utf-8');

  return { categories, posts };
}

export async function runBuildContent(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const contentDir = path.join(__dirname, '..', 'content');
  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  const { categories, posts } = await buildContentData(contentDir, publicDataDir);
  console.log('Content built: %d posts, %d categories', posts.length, categories.length);
}
