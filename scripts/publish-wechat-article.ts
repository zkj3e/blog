import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

import { exportMarkdownToWechatHtml } from './wechat/export-wechat-html';
import { publishWechatDraft } from './wechat/publish-via-cdp';

const wechatArticleScript = '/Users/bigo/.codex/skills/baoyu-post-to-wechat/scripts/wechat-article.ts';

function printUsage(): never {
  console.log(`Publish a Markdown article to WeChat through generated HTML

Usage:
  node --import tsx scripts/publish-wechat-article.ts --markdown content/posts/example.md [--submit]

Options:
  --markdown <path>         Markdown article path
  --output-dir <dir>        Optional directory for generated HTML
  --formula-cache-dir <dir> Optional formula cache directory
  --submit                  Submit instead of saving draft
  --profile-dir <dir>       Pass through to wechat-article.ts
  --cdp-port <port>         Pass through to wechat-article.ts
  --dry-run                 Print command without executing
`);
  process.exit(0);
}

function buildDefaultOutputPath(markdownPath: string, outputDir?: string): string {
  const slug = path.basename(markdownPath, path.extname(markdownPath));
  const baseDir = outputDir ? path.resolve(outputDir) : path.join(process.cwd(), '.wechat-preview', slug);
  return path.join(baseDir, 'article.html');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
  }

  let markdownPath = '';
  let outputDir: string | undefined;
  let formulaCacheDir: string | undefined;
  let profileDir: string | undefined;
  let cdpPort: string | undefined;
  let submit = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? '';
    if (arg === '--markdown' && args[i + 1]) markdownPath = args[++i]!;
    else if (arg === '--output-dir' && args[i + 1]) outputDir = args[++i]!;
    else if (arg === '--formula-cache-dir' && args[i + 1]) formulaCacheDir = args[++i]!;
    else if (arg === '--profile-dir' && args[i + 1]) profileDir = args[++i]!;
    else if (arg === '--cdp-port' && args[i + 1]) cdpPort = args[++i]!;
    else if (arg === '--submit') submit = true;
    else if (arg === '--dry-run') dryRun = true;
  }

  if (!markdownPath) {
    throw new Error('--markdown is required');
  }

  const resolvedMarkdownPath = path.resolve(markdownPath);
  const outputPath = buildDefaultOutputPath(resolvedMarkdownPath, outputDir);

  const exported = await exportMarkdownToWechatHtml({
    inputPath: resolvedMarkdownPath,
    outputPath,
    formulaCacheDir: formulaCacheDir ? path.resolve(formulaCacheDir) : undefined,
  });

  const commandArgs = ['-y', 'bun', wechatArticleScript, '--html', outputPath];
  if (submit) commandArgs.push('--submit');
  if (profileDir) commandArgs.push('--profile-dir', profileDir);
  if (cdpPort) commandArgs.push('--cdp-port', cdpPort);

  if (dryRun) {
    console.log(['npx', ...commandArgs].join(' '));
    return;
  }

  const result = await publishWechatDraft({
    title: exported.title,
    summary: exported.summary,
    bodyHtml: exported.bodyHtml,
    profileDir: profileDir ? path.resolve(profileDir) : undefined,
    cdpPort: cdpPort ? Number(cdpPort) : undefined,
  });

  if (!result.saved) {
    throw new Error(`Draft save could not be verified (wordCount=${result.wordCount || 'unknown'})`);
  }

  console.log(`Draft saved. wordCount=${result.wordCount || 'unknown'}`);
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
