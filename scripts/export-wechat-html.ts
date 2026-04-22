import path from 'node:path';
import process from 'node:process';

import { exportMarkdownToWechatHtml } from './wechat/export-wechat-html';

function printUsage(): never {
  console.log(`Export Markdown to a WeChat-safe HTML document

Usage:
  node --import tsx scripts/export-wechat-html.ts --input content/posts/example.md --output .wechat-preview/example/article.html

Options:
  --input <path>            Markdown article path
  --output <path>           Output HTML path
  --formula-cache-dir <dir> Optional formula cache directory
`);
  process.exit(0);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
  }

  let inputPath = '';
  let outputPath = '';
  let formulaCacheDir: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? '';
    if (arg === '--input' && args[i + 1]) {
      inputPath = args[++i]!;
    } else if (arg === '--output' && args[i + 1]) {
      outputPath = args[++i]!;
    } else if (arg === '--formula-cache-dir' && args[i + 1]) {
      formulaCacheDir = args[++i]!;
    }
  }

  if (!inputPath || !outputPath) {
    throw new Error('--input and --output are required');
  }

  const result = await exportMarkdownToWechatHtml({
    inputPath,
    outputPath,
    formulaCacheDir: formulaCacheDir ? path.resolve(formulaCacheDir) : undefined,
  });

  console.log(`Exported WeChat HTML: ${result.outputPath}`);
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
