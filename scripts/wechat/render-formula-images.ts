import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

import katex from 'katex';
import { chromium, type Browser, type Page } from 'playwright-core';

import type { FormulaRenderInput, FormulaRenderResult } from '../content-pipeline';
import {
  getFormulaCacheRecord,
  readFormulaMetadata,
  writeFormulaMetadata,
} from './formula-cache';

const require = createRequire(import.meta.url);
const katexCssPath = require.resolve('katex/dist/katex.min.css');
const katexCss = fs.readFileSync(katexCssPath, 'utf-8');

let browserPromise: Promise<Browser> | null = null;
let pagePromise: Promise<Page> | null = null;

function resolveChromeExecutable(): string {
  const envCandidates = [process.env.WECHAT_FORMULA_CHROME, process.env.CHROME_EXECUTABLE_PATH].filter(Boolean) as string[];
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (process.platform === 'darwin') {
    const macCandidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
    for (const candidate of macCandidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  const whichCandidates = process.platform === 'win32'
    ? []
    : ['google-chrome', 'chromium', 'chromium-browser'];

  for (const command of whichCandidates) {
    const result = spawnSync('which', [command], { encoding: 'utf-8' });
    const executablePath = result.stdout.trim();
    if (result.status === 0 && executablePath) {
      return executablePath;
    }
  }

  throw new Error('Unable to find a Chrome/Chromium executable for formula rendering.');
}

async function getFormulaPage(): Promise<Page> {
  if (!pagePromise) {
    if (!browserPromise) {
      browserPromise = chromium.launch({
        executablePath: resolveChromeExecutable(),
        headless: true,
      });
    }

    pagePromise = browserPromise.then(async (browser) => {
      const page = await browser.newPage({
        deviceScaleFactor: 2,
      });
      return page;
    });
  }

  return await pagePromise;
}

export async function closeFormulaRendererBrowser(): Promise<void> {
  const browser = browserPromise ? await browserPromise : null;
  pagePromise = null;
  browserPromise = null;
  if (browser) {
    await browser.close();
  }
}

function toDataUri(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function buildFormulaMarkup(input: FormulaRenderInput): string {
  return katex.renderToString(input.latex, {
    displayMode: input.displayMode,
    output: 'html',
    throwOnError: true,
    strict: 'warn',
  });
}

export async function renderFormulaImage(
  input: FormulaRenderInput & { cacheDir: string },
): Promise<FormulaRenderResult> {
  const record = getFormulaCacheRecord(input.cacheDir, input.latex, input.displayMode);
  const cachedMeta = readFormulaMetadata(record.metaPath);

  if (fs.existsSync(record.pngPath) && cachedMeta) {
    return {
      dataUri: toDataUri(record.pngPath),
      cachePath: record.pngPath,
      width: cachedMeta.width,
      height: cachedMeta.height,
    };
  }

  const page = await getFormulaPage();
  const formulaMarkup = buildFormulaMarkup(input);
  const bodyClass = input.displayMode ? 'display' : 'inline';

  await page.setContent(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${katexCss}
      html, body {
        margin: 0;
        padding: 0;
        background: white;
      }
      body {
        display: inline-block;
        padding: ${input.displayMode ? '20px 24px' : '6px 8px'};
      }
      #formula-root.inline {
        display: inline-block;
      }
      #formula-root.display {
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div id="formula-root" class="${bodyClass}">${formulaMarkup}</div>
  </body>
</html>`,
  );

  const formula = page.locator('#formula-root');
  const box = await formula.boundingBox();
  if (!box) {
    throw new Error(`Failed to measure rendered formula: ${input.latex}`);
  }

  await formula.screenshot({
    path: record.pngPath,
    omitBackground: false,
  });

  const metadata = {
    width: Math.max(1, Math.round(box.width)),
    height: Math.max(1, Math.round(box.height)),
  };
  writeFormulaMetadata(record.metaPath, metadata);

  return {
    dataUri: toDataUri(record.pngPath),
    cachePath: record.pngPath,
    width: metadata.width,
    height: metadata.height,
  };
}

