import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const katexVersion = require('katex/package.json').version as string;

export interface FormulaCacheRecord {
  hash: string;
  pngPath: string;
  metaPath: string;
}

export interface FormulaImageMetadata {
  width: number;
  height: number;
}

function buildFormulaHash(latex: string, displayMode: boolean): string {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify({ latex, displayMode, renderer: 'katex-playwright', katexVersion }))
    .digest('hex');
}

export function ensureFormulaCacheDir(cacheDir: string): string {
  fs.mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

export function getFormulaCacheRecord(cacheDir: string, latex: string, displayMode: boolean): FormulaCacheRecord {
  ensureFormulaCacheDir(cacheDir);
  const hash = buildFormulaHash(latex, displayMode);
  return {
    hash,
    pngPath: path.join(cacheDir, `${hash}.png`),
    metaPath: path.join(cacheDir, `${hash}.json`),
  };
}

export function readFormulaMetadata(metaPath: string): FormulaImageMetadata | null {
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as FormulaImageMetadata;
}

export function writeFormulaMetadata(metaPath: string, metadata: FormulaImageMetadata): void {
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
}
