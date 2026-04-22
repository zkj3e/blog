import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

import { markdownToHtmlWithToc } from '../content-pipeline';

export interface WechatExportOptions {
  inputPath: string;
  outputPath: string;
  formulaCacheDir?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWechatDocument(params: {
  title: string;
  summary: string;
  author: string;
  bodyHtml: string;
}): string {
  const { title, summary, author, bodyHtml } = params;
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(summary)}" />
    ${author ? `<meta name="author" content="${escapeHtml(author)}" />` : ''}
    <style>
      :root {
        color-scheme: light;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
        color: #1f2937;
      }
      #output {
        width: 720px;
        box-sizing: border-box;
        margin: 0 auto;
        padding: 28px 32px 48px;
        line-height: 1.75;
        font-size: 16px;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #111827;
        line-height: 1.35;
        margin: 1.6em 0 0.75em;
      }
      h1 { font-size: 32px; }
      h2 { font-size: 28px; }
      h3 { font-size: 24px; }
      p, ul, ol, blockquote, pre, figure {
        margin: 1.2em 0;
      }
      ul, ol {
        padding-left: 1.5em;
      }
      a {
        color: #2563eb;
      }
      img {
        max-width: 100%;
      }
      pre {
        overflow-x: auto;
        padding: 14px 16px;
        border-radius: 12px;
        background: #0f172a;
        color: #f8fafc;
      }
      code {
        font-family: "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace;
      }
      :not(pre) > code {
        padding: 0.15em 0.35em;
        border-radius: 6px;
        background: #f3f4f6;
      }
      blockquote {
        margin-left: 0;
        padding-left: 1em;
        border-left: 4px solid #cbd5e1;
        color: #475569;
      }
      .wechat-formula-display {
        text-align: center;
        margin: 1.4em 0;
      }
      .wechat-formula-display img {
        display: inline-block;
      }
      .wechat-formula-fallback {
        white-space: pre-wrap;
        word-break: break-word;
      }
      figure img,
      figure svg {
        display: block;
        width: 100%;
        height: auto;
      }
      figcaption {
        margin-top: 0.85em;
        color: #6b7280;
        font-size: 14px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div id="output">${bodyHtml}</div>
  </body>
</html>`;
}

export async function exportMarkdownToWechatHtml(options: WechatExportOptions): Promise<{
  outputPath: string;
  title: string;
  summary: string;
  bodyHtml: string;
}> {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = path.resolve(options.outputPath);
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const { data: frontmatter, content } = matter(raw) as {
    data: Record<string, string>;
    content: string;
  };

  const { html } = await markdownToHtmlWithToc(content, {
    target: 'wechat',
    formulaCacheDir: options.formulaCacheDir,
  });

  const title = frontmatter.title ?? path.basename(inputPath, path.extname(inputPath));
  const summary = frontmatter.excerpt ?? '';
  const author = frontmatter.author ?? '';
  const documentHtml = buildWechatDocument({
    title,
    summary,
    author,
    bodyHtml: html,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, documentHtml, 'utf-8');

  return { outputPath, title, summary, bodyHtml: html };
}
