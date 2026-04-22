import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { markdownToHtmlWithToc } from './content-pipeline';

test('renders inline and display math as image tags for wechat output', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-math-'));
  const { html, toc } = await (markdownToHtmlWithToc as unknown as (
    markdown: string,
    options: {
      target: 'wechat';
      formulaRenderer: (input: { latex: string; displayMode: boolean }) => Promise<{
        dataUri: string;
        cachePath: string;
        width: number;
        height: number;
      }>;
      formulaCacheDir: string;
    },
  ) => Promise<{ html: string; toc: Array<{ depth: number; text: string; id: string }> }>)(`
## 公式

行内 $f_\\theta(x)$ 和块级：

$$
\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta J(\\theta_t)
$$

\`\`\`ts
const literal = '$not_math$';
\`\`\`
`, {
    target: 'wechat',
    formulaCacheDir: tempDir,
    formulaRenderer: async ({ latex, displayMode }) => ({
      dataUri: `data:image/png;base64,${Buffer.from(`${displayMode ? 'block' : 'inline'}:${latex}`).toString('base64')}`,
      cachePath: path.join(tempDir, `${displayMode ? 'block' : 'inline'}.png`),
      width: displayMode ? 320 : 96,
      height: displayMode ? 72 : 24,
    }),
  });

  assert.deepEqual(toc, [{ depth: 2, text: '公式', id: '公式' }]);
  assert.match(html, /data-wechat-formula="inline"/);
  assert.match(html, /data-wechat-formula="display"/);
  assert.match(html, /data:image\/png;base64/);
  assert.doesNotMatch(html, /class="katex/);
  assert.match(html, /\$not_math\$/);
});

test('falls back to readable formula text when wechat formula rendering fails', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-math-fallback-'));
  const { html } = await (markdownToHtmlWithToc as unknown as (
    markdown: string,
    options: {
      target: 'wechat';
      formulaRenderer: (input: { latex: string; displayMode: boolean }) => Promise<{
        dataUri: string;
        cachePath: string;
        width: number;
        height: number;
      }>;
      formulaCacheDir: string;
    },
  ) => Promise<{ html: string }>)(
    `
失败公式 $\\badcommand{oops}$ 和

$$
\\stillbad{oops}
$$
`,
    {
      target: 'wechat',
      formulaCacheDir: tempDir,
      formulaRenderer: async () => {
        throw new Error('invalid formula');
      },
    },
  );

  assert.match(html, /wechat-formula-fallback/);
  assert.match(html, /\\badcommand/);
  assert.match(html, /\\stillbad/);
});

test('uses the default wechat formula renderer and caches repeated formulas', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-math-cache-'));
  const markdown = `
重复行内公式 $f_\\theta(x)$ 再来一次 $f_\\theta(x)$。

$$
\\hat{y} = Xw + b\\mathbf{1}
$$
`;

  const { html } = await markdownToHtmlWithToc(markdown, {
    target: 'wechat',
    formulaCacheDir: tempDir,
  });

  const pngFiles = fs.readdirSync(tempDir).filter((file) => file.endsWith('.png'));

  assert.match(html, /data-wechat-formula="inline"/);
  assert.match(html, /data-wechat-formula="display"/);
  assert.ok(pngFiles.length >= 2, 'expected cached png files to be created');
  assert.equal(new Set(pngFiles).size, pngFiles.length);
});

test('exports a standalone wechat html document from markdown', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-export-cli-'));
  const markdownPath = path.join(tempDir, 'post.md');
  const outputPath = path.join(tempDir, 'wechat.html');

  fs.writeFileSync(
    markdownPath,
    `---
title: 公式文章
date: 2026-04-22
category: ai
excerpt: 公式摘要
---

这里有一个公式 $f_\\theta(x)$。
`,
    'utf-8',
  );

  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/export-wechat-html.ts', '--input', markdownPath, '--output', outputPath],
    {
      cwd: process.cwd(),
      encoding: 'utf-8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(outputPath), 'expected wechat html output to exist');

  const html = fs.readFileSync(outputPath, 'utf-8');
  assert.match(html, /<title>公式文章<\/title>/);
  assert.match(html, /data-wechat-formula="inline"/);
  assert.match(html, /data:image\/png;base64/);
});

test('builds a publish command that routes wechat posting through generated html', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-publish-cli-'));
  const markdownPath = path.join(tempDir, 'post.md');

  fs.writeFileSync(
    markdownPath,
    `---
title: 发布测试
date: 2026-04-22
category: ai
excerpt: 发布摘要
---

块级公式：

$$
\\hat{y} = Xw + b\\mathbf{1}
$$
`,
    'utf-8',
  );

  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/publish-wechat-article.ts', '--markdown', markdownPath, '--dry-run'],
    {
      cwd: process.cwd(),
      encoding: 'utf-8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /--html/);
  assert.doesNotMatch(result.stdout, /--markdown/);
});
