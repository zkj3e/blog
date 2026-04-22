# WeChat CLI Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客仓库实现一个可复用的微信公众号发布 CLI 工具箱，统一 `prepare / publish / cover / verify / retry / all` 全流程，并保留现有兼容入口。

**Architecture:** 在 `scripts/wechat/` 下新增上下文、状态、准备产物、封面应用、草稿校验模块，由 `scripts/wechat-cli.ts` 统一编排。现有 `export-wechat-html.ts` 和 `publish-wechat-article.ts` 保留为兼容入口，但内部复用新模块与状态文件，所有中间产物都收敛到 `.wechat-preview/<slug>/`。

**Tech Stack:** TypeScript ESM, Node.js, `tsx`, `node:test`, `gray-matter`, existing WeChat CDP utilities, existing markdown/math export pipeline

---

## File Structure

### Create
- `scripts/wechat/resolve-post-context.ts`
- `scripts/wechat/state-store.ts`
- `scripts/wechat/prepare-publish-artifacts.ts`
- `scripts/wechat/apply-cover-via-cdp.ts`
- `scripts/wechat/verify-draft.ts`
- `scripts/wechat-cli.ts`
- `scripts/wechat-cli.test.ts`

### Modify
- `scripts/wechat/export-wechat-html.ts`
- `scripts/wechat/publish-via-cdp.ts`
- `scripts/export-wechat-html.ts`
- `scripts/publish-wechat-article.ts`
- `scripts/wechat-export.test.ts`
- `package.json`

## Task 1: Post Context And State Store

**Files:**
- Create: `scripts/wechat/resolve-post-context.ts`
- Create: `scripts/wechat/state-store.ts`
- Create: `scripts/wechat-cli.test.ts`
- Test: `scripts/wechat-cli.test.ts`

- [ ] **Step 1: Write the failing tests for post context resolution and state persistence**

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resolvePostContext } from './wechat/resolve-post-context';
import { createInitialPublishState, readPublishState, updateStepState, writePublishState } from './wechat/state-store';

test('resolvePostContext builds slug workDir and default cover path candidates', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-context-'));
  const postDir = path.join(root, 'content', 'posts');
  fs.mkdirSync(path.join(postDir, 'imgs'), { recursive: true });
  const postPath = path.join(postDir, 'hello-world.md');
  fs.writeFileSync(postPath, `---\ntitle: Hello World\ncover: ./hero.png\n---\n\ncontent\n`, 'utf-8');

  const ctx = resolvePostContext({
    postPath,
    cwd: root,
  });

  assert.equal(ctx.slug, 'hello-world');
  assert.equal(ctx.title, 'Hello World');
  assert.match(ctx.workDir, /\.wechat-preview\/hello-world$/);
  assert.equal(ctx.coverCandidates[0]?.endsWith('hero.png'), true);
  assert.equal(ctx.coverCandidates.some((candidate) => candidate.endsWith('imgs/cover.png')), true);
});

test('state store writes initial state and updates individual step status', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-state-'));
  const statePath = path.join(root, 'publish-state.json');

  const state = createInitialPublishState({
    postPath: 'content/posts/hello-world.md',
    slug: 'hello-world',
    title: 'Hello World',
    workDir: '.wechat-preview/hello-world',
    htmlPath: '.wechat-preview/hello-world/article.html',
    coverPath: '.wechat-preview/hello-world/cover.png',
  });
  writePublishState(statePath, state);
  updateStepState(statePath, 'prepare', {
    status: 'success',
    startedAt: '2026-04-22T10:00:00.000Z',
    finishedAt: '2026-04-22T10:00:02.000Z',
    error: null,
  });

  const saved = readPublishState(statePath);
  assert.equal(saved.steps.prepare.status, 'success');
  assert.equal(saved.steps.publish.status, 'pending');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: FAIL with module-not-found errors for `./wechat/resolve-post-context` and `./wechat/state-store`

- [ ] **Step 3: Write the minimal post context resolver**

```ts
// scripts/wechat/resolve-post-context.ts
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface ResolvedPostContext {
  postPath: string;
  slug: string;
  title: string;
  summary: string;
  workDir: string;
  htmlPath: string;
  statePath: string;
  logPath: string;
  coverOutputPath: string;
  formulaCacheDir: string;
  coverCandidates: string[];
}

export function resolvePostContext(options: { postPath: string; cwd?: string; coverPath?: string }): ResolvedPostContext {
  const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const postPath = path.resolve(cwd, options.postPath);
  const raw = fs.readFileSync(postPath, 'utf-8');
  const { data, content } = matter(raw) as { data: Record<string, string>; content: string };
  const slug = data.slug ?? path.basename(postPath, path.extname(postPath));
  const title = data.title ?? slug;
  const summary = data.excerpt ?? content.split('\n').find((line) => line.trim()) ?? '';
  const workDir = path.join(cwd, '.wechat-preview', slug);
  const postDir = path.dirname(postPath);
  const frontmatterCover = data.coverImage ?? data.featureImage ?? data.cover ?? data.image;
  const coverCandidates = [
    options.coverPath ? path.resolve(cwd, options.coverPath) : null,
    frontmatterCover ? path.resolve(postDir, frontmatterCover) : null,
    path.join(postDir, 'imgs', 'cover.png'),
    path.join(workDir, 'cover.png'),
  ].filter((value): value is string => Boolean(value));

  return {
    postPath,
    slug,
    title,
    summary,
    workDir,
    htmlPath: path.join(workDir, 'article.html'),
    statePath: path.join(workDir, 'publish-state.json'),
    logPath: path.join(workDir, 'run.log'),
    coverOutputPath: path.join(workDir, 'cover.png'),
    formulaCacheDir: path.join(cwd, '.wechat-cache', 'formulas'),
    coverCandidates,
  };
}
```

- [ ] **Step 4: Write the minimal state store**

```ts
// scripts/wechat/state-store.ts
import fs from 'node:fs';
import path from 'node:path';

export type PublishStepName = 'prepare' | 'publish' | 'cover' | 'verify';
export type PublishStepStatus = 'pending' | 'running' | 'success' | 'failed';

export interface PublishStepState {
  status: PublishStepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

export interface PublishState {
  postPath: string;
  slug: string;
  title: string;
  workDir: string;
  htmlPath: string;
  coverPath: string;
  steps: Record<PublishStepName, PublishStepState>;
  verifyResult: {
    titleMatches: boolean;
    wordCount: number;
    hasCover: boolean;
    hasLatexText: boolean;
    formulaImageCount: number;
    imageCount: number;
  } | null;
  draftContext: {
    editorUrl: string;
    lastUpdatedAt: string;
  };
}

export function createInitialPublishState(input: Omit<PublishState, 'steps' | 'verifyResult' | 'draftContext'>): PublishState {
  const emptyStep = (): PublishStepState => ({ status: 'pending', startedAt: null, finishedAt: null, error: null });
  return {
    ...input,
    steps: {
      prepare: emptyStep(),
      publish: emptyStep(),
      cover: emptyStep(),
      verify: emptyStep(),
    },
    verifyResult: null,
    draftContext: {
      editorUrl: '',
      lastUpdatedAt: '',
    },
  };
}

export function readPublishState(statePath: string): PublishState {
  return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as PublishState;
}

export function writePublishState(statePath: string, state: PublishState): void {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function updateStepState(statePath: string, step: PublishStepName, next: PublishStepState): PublishState {
  const state = readPublishState(statePath);
  state.steps[step] = next;
  writePublishState(statePath, state);
  return state;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: PASS with 2 tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/wechat/resolve-post-context.ts scripts/wechat/state-store.ts scripts/wechat-cli.test.ts
git commit -m "feat: add wechat publish context and state store"
```

## Task 2: Prepare Step And Export Integration

**Files:**
- Create: `scripts/wechat/prepare-publish-artifacts.ts`
- Modify: `scripts/wechat/export-wechat-html.ts`
- Modify: `scripts/export-wechat-html.ts`
- Modify: `scripts/wechat-cli.test.ts`
- Test: `scripts/wechat-cli.test.ts`

- [ ] **Step 1: Write the failing tests for prepare output generation and cover copying**

```ts
import { preparePublishArtifacts } from './wechat/prepare-publish-artifacts';

test('preparePublishArtifacts creates article html copies cover and initializes state', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-prepare-'));
  const postDir = path.join(root, 'content', 'posts', 'demo-post');
  fs.mkdirSync(path.join(postDir, 'imgs'), { recursive: true });
  const postPath = path.join(postDir, 'index.md');
  fs.writeFileSync(postPath, `---\ntitle: Demo\nexcerpt: Summary\nslug: demo-post\n---\n\n公式 $x^2$\n`, 'utf-8');
  fs.writeFileSync(path.join(postDir, 'imgs', 'cover.png'), 'cover', 'utf-8');

  const result = await preparePublishArtifacts({
    postPath,
    cwd: root,
  });

  assert.ok(fs.existsSync(result.context.htmlPath));
  assert.ok(fs.existsSync(result.context.coverOutputPath));
  assert.equal(result.state.steps.prepare.status, 'success');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: FAIL with module-not-found error for `./wechat/prepare-publish-artifacts`

- [ ] **Step 3: Implement prepare step with exporter reuse**

```ts
// scripts/wechat/prepare-publish-artifacts.ts
import fs from 'node:fs';

import { exportMarkdownToWechatHtml } from './export-wechat-html';
import { resolvePostContext } from './resolve-post-context';
import { createInitialPublishState, updateStepState, writePublishState, type PublishState } from './state-store';

function resolveExistingCover(candidates: string[]): string | null {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export async function preparePublishArtifacts(options: { postPath: string; cwd?: string; coverPath?: string }): Promise<{
  context: ReturnType<typeof resolvePostContext>;
  state: PublishState;
}> {
  const context = resolvePostContext(options);
  const initialState = createInitialPublishState({
    postPath: context.postPath,
    slug: context.slug,
    title: context.title,
    workDir: context.workDir,
    htmlPath: context.htmlPath,
    coverPath: context.coverOutputPath,
  });
  writePublishState(context.statePath, initialState);
  updateStepState(context.statePath, 'prepare', {
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  });

  try {
    await exportMarkdownToWechatHtml({
      inputPath: context.postPath,
      outputPath: context.htmlPath,
      formulaCacheDir: context.formulaCacheDir,
    });
    const coverPath = resolveExistingCover(context.coverCandidates);
    if (coverPath) {
      fs.mkdirSync(context.workDir, { recursive: true });
      fs.copyFileSync(coverPath, context.coverOutputPath);
    }
    const finished = updateStepState(context.statePath, 'prepare', {
      status: 'success',
      startedAt: initialState.steps.prepare.startedAt,
      finishedAt: new Date().toISOString(),
      error: null,
    });
    return { context, state: finished };
  } catch (error) {
    const failed = updateStepState(context.statePath, 'prepare', {
      status: 'failed',
      startedAt: initialState.steps.prepare.startedAt,
      finishedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw Object.assign(error instanceof Error ? error : new Error(String(error)), { publishState: failed });
  }
}
```

- [ ] **Step 4: Update exporter return shape only as needed by prepare**

```ts
// scripts/wechat/export-wechat-html.ts
export async function exportMarkdownToWechatHtml(options: WechatExportOptions): Promise<{
  outputPath: string;
  title: string;
  summary: string;
  bodyHtml: string;
  author: string;
}> {
  // keep existing implementation and add `author` to the returned payload
}
```

- [ ] **Step 5: Run focused tests to verify prepare passes**

Run: `npm test -- scripts/wechat-cli.test.ts scripts/wechat-export.test.ts`

Expected: PASS with previous export tests still green and new prepare test passing

- [ ] **Step 6: Commit**

```bash
git add scripts/wechat/prepare-publish-artifacts.ts scripts/wechat/export-wechat-html.ts scripts/export-wechat-html.ts scripts/wechat-cli.test.ts
git commit -m "feat: add wechat prepare step artifacts"
```

## Task 3: Publish Cover Verify And Retry Logic

**Files:**
- Create: `scripts/wechat/apply-cover-via-cdp.ts`
- Create: `scripts/wechat/verify-draft.ts`
- Modify: `scripts/wechat/publish-via-cdp.ts`
- Modify: `scripts/wechat-cli.test.ts`
- Test: `scripts/wechat-cli.test.ts`

- [ ] **Step 1: Write the failing tests for retry selection and verification heuristics**

```ts
import { chooseRetryStep, summarizeVerifyResult } from './wechat/verify-draft';

test('chooseRetryStep returns cover when cover step failed last', () => {
  const state = createInitialPublishState({
    postPath: 'content/posts/demo.md',
    slug: 'demo',
    title: 'Demo',
    workDir: '.wechat-preview/demo',
    htmlPath: '.wechat-preview/demo/article.html',
    coverPath: '.wechat-preview/demo/cover.png',
  });
  state.steps.prepare.status = 'success';
  state.steps.publish.status = 'success';
  state.steps.cover.status = 'failed';

  assert.equal(chooseRetryStep(state), 'cover');
});

test('summarizeVerifyResult flags latex residue and missing cover', () => {
  const result = summarizeVerifyResult({
    title: 'Demo',
    expectedTitle: 'Demo',
    textContent: '正文中还残留 \\theta',
    wordCount: 120,
    imageCount: 2,
    coverCount: 0,
    hasCoverError: true,
  });

  assert.equal(result.titleMatches, true);
  assert.equal(result.hasCover, false);
  assert.equal(result.hasLatexText, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: FAIL because `chooseRetryStep` and `summarizeVerifyResult` do not exist

- [ ] **Step 3: Extract retry and verification helpers**

```ts
// scripts/wechat/verify-draft.ts
import { type PublishState, type PublishStepName } from './state-store';

export interface DraftSnapshot {
  title: string;
  expectedTitle: string;
  textContent: string;
  wordCount: number;
  imageCount: number;
  coverCount: number;
  hasCoverError: boolean;
}

export function summarizeVerifyResult(snapshot: DraftSnapshot) {
  const hasLatexText = /\$\$|\\theta|\\min|\\arg/.test(snapshot.textContent);
  return {
    titleMatches: snapshot.title === snapshot.expectedTitle,
    wordCount: snapshot.wordCount,
    hasCover: snapshot.coverCount > 0 && !snapshot.hasCoverError,
    hasLatexText,
    formulaImageCount: snapshot.imageCount,
    imageCount: snapshot.imageCount,
  };
}

export function chooseRetryStep(state: PublishState): PublishStepName {
  if (state.steps.verify.status === 'failed') {
    if (state.verifyResult?.wordCount === 0) return 'publish';
    if (state.verifyResult && !state.verifyResult.hasCover) return 'cover';
    if (state.verifyResult?.hasLatexText) return 'prepare';
  }
  const failed = (['prepare', 'publish', 'cover', 'verify'] as PublishStepName[]).find((step) => state.steps[step].status === 'failed');
  return failed ?? 'prepare';
}
```

- [ ] **Step 4: Implement cover application and richer publish return values**

```ts
// scripts/wechat/publish-via-cdp.ts
export async function publishWechatDraft(options: {
  title: string;
  summary: string;
  bodyHtml: string;
  profileDir?: string;
  cdpPort?: number;
}): Promise<{ saved: boolean; wordCount: string; editorUrl: string }> {
  // keep the existing body injection flow and return:
  // const editorUrl = await evaluate<string>(session, 'window.location.href');
  // return { saved: result.saved, wordCount: result.wordCount, editorUrl };
}

// scripts/wechat/apply-cover-via-cdp.ts
import fs from 'node:fs';
import { clickElement, evaluate, findExistingChromeDebugPort, getPageSession, launchChrome, sleep, tryConnectExisting } from '/Users/bigo/.codex/skills/baoyu-post-to-wechat/scripts/cdp.ts';

export async function applyWechatCover(options: {
  coverPath: string;
  profileDir?: string;
  cdpPort?: number;
}): Promise<{ saved: boolean }> {
  if (!fs.existsSync(options.coverPath)) {
    throw new Error(`Cover file not found: ${options.coverPath}`);
  }
  // 1. connect to existing Chrome or launch one
  // 2. attach the latest `appmsg_edit` page
  // 3. click `封面和摘要`, then `换一张` or fallback `选择封面`
  // 4. use `DOM.setFileInputFiles` on `.weui-desktop-dialog input[type=file]`
  // 5. click uploaded image tile
  // 6. click `下一步`
  // 7. click `完成` when present, then always click `确认`
  // 8. click save button and `继续保存` when present
  // 9. inspect page text and return `{ saved: true }` when no `图片不能为空` error remains
}
```

- [ ] **Step 5: Implement browser-side verify snapshot**

```ts
// scripts/wechat/verify-draft.ts
import { evaluate, findExistingChromeDebugPort, tryConnectExisting } from '/Users/bigo/.codex/skills/baoyu-post-to-wechat/scripts/cdp.ts';

export async function verifyWechatDraft(options: {
  expectedTitle: string;
  cdpPort?: number;
}): Promise<ReturnType<typeof summarizeVerifyResult>> {
  // connect to current `appmsg_edit` tab
  // read:
  //   title from `#title`
  //   text content from `.ProseMirror`
  //   image count from `.ProseMirror img`
  //   cover count from `.appmsg_preview_container img, .preview_media_add_wrp img`
  //   page text for `图片不能为空`
  // build:
  //   const snapshot = {
  //     title,
  //     expectedTitle: options.expectedTitle,
  //     textContent,
  //     wordCount: Number((pageText.match(/正文字数\\s*(\\d+)/) || [])[1] || '0'),
  //     imageCount,
  //     coverCount,
  //     hasCoverError: pageText.includes('图片不能为空'),
  //   };
  // return summarizeVerifyResult(snapshot);
}
```

- [ ] **Step 6: Run focused tests to verify retry helpers pass**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: PASS with retry-selection and verify-summary tests green

- [ ] **Step 7: Commit**

```bash
git add scripts/wechat/apply-cover-via-cdp.ts scripts/wechat/verify-draft.ts scripts/wechat/publish-via-cdp.ts scripts/wechat-cli.test.ts
git commit -m "feat: add wechat cover and verify helpers"
```

## Task 4: Unified CLI And Compatibility Entrypoints

**Files:**
- Create: `scripts/wechat-cli.ts`
- Modify: `scripts/publish-wechat-article.ts`
- Modify: `package.json`
- Modify: `scripts/wechat-export.test.ts`
- Modify: `scripts/wechat-cli.test.ts`
- Test: `scripts/wechat-cli.test.ts`

- [ ] **Step 1: Write the failing tests for CLI dry-run and subcommand dispatch**

```ts
test('wechat-cli all --dry-run prints ordered steps', () => {
  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/wechat-cli.ts', 'all', '--post', 'content/posts/from-linear-fitting-to-deep-learning.md', '--dry-run'],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /prepare -> publish -> cover -> verify/);
});

test('wechat-cli retry chooses last failed step from state file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-retry-'));
  const postDir = path.join(root, 'content', 'posts');
  fs.mkdirSync(postDir, { recursive: true });
  const postPath = path.join(postDir, 'demo.md');
  fs.writeFileSync(postPath, `---\ntitle: Demo\n---\n\ncontent\n`, 'utf-8');
  const stateDir = path.join(root, '.wechat-preview', 'demo');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'publish-state.json'),
    JSON.stringify({
      postPath,
      slug: 'demo',
      title: 'Demo',
      workDir: stateDir,
      htmlPath: path.join(stateDir, 'article.html'),
      coverPath: path.join(stateDir, 'cover.png'),
      steps: {
        prepare: { status: 'success', startedAt: '', finishedAt: '', error: null },
        publish: { status: 'success', startedAt: '', finishedAt: '', error: null },
        cover: { status: 'failed', startedAt: '', finishedAt: '', error: '图片不能为空' },
        verify: { status: 'pending', startedAt: null, finishedAt: null, error: null }
      },
      verifyResult: null,
      draftContext: { editorUrl: '', lastUpdatedAt: '' }
    }, null, 2),
    'utf-8',
  );

  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/wechat-cli.ts', 'retry', '--post', postPath, '--dry-run'],
    { cwd: root, encoding: 'utf-8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Retry step: cover/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/wechat-cli.test.ts`

Expected: FAIL because `scripts/wechat-cli.ts` does not exist

- [ ] **Step 3: Implement unified CLI**

```ts
// scripts/wechat-cli.ts
import { preparePublishArtifacts } from './wechat/prepare-publish-artifacts';
import { publishWechatDraft } from './wechat/publish-via-cdp';
import { applyWechatCover } from './wechat/apply-cover-via-cdp';
import { chooseRetryStep, verifyWechatDraft } from './wechat/verify-draft';
import { readPublishState, updateStepState } from './wechat/state-store';
import { resolvePostContext } from './wechat/resolve-post-context';

const command = args[0];
const options = parseArgs(args.slice(1));
const context = resolvePostContext({ postPath: options.post, coverPath: options.cover });

if (command === 'prepare') {
  await preparePublishArtifacts({ postPath: options.post, coverPath: options.cover });
}

if (command === 'publish') {
  const state = readPublishState(context.statePath);
  await publishWechatDraft({
    title: state.title,
    summary: context.summary,
    bodyHtml: fs.readFileSync(context.htmlPath, 'utf-8'),
    cdpPort: options.cdpPort,
    profileDir: options.profileDir,
  });
}

if (command === 'cover') {
  await applyWechatCover({
    coverPath: context.coverOutputPath,
    cdpPort: options.cdpPort,
    profileDir: options.profileDir,
  });
}

if (command === 'verify') {
  const result = await verifyWechatDraft({ expectedTitle: context.title, cdpPort: options.cdpPort });
  console.log(JSON.stringify(result, null, 2));
}

if (command === 'retry') {
  const retryStep = chooseRetryStep(readPublishState(context.statePath));
  console.log(`Retry step: ${retryStep}`);
}

if (command === 'all') {
  console.log('prepare -> publish -> cover -> verify');
}
```

- [ ] **Step 4: Point compatibility entrypoints at the new CLI shape**

```ts
// scripts/publish-wechat-article.ts
// keep current flags `--markdown --output-dir --formula-cache-dir --profile-dir --cdp-port --dry-run`
// resolve markdown path -> derive workDir/outputPath -> call `preparePublishArtifacts(...)`
// then call `publishWechatDraft(...)` with exported title/summary/bodyHtml
// if `context.coverOutputPath` exists, call `applyWechatCover(...)`
// print `Draft saved. wordCount=<n>` on success

// package.json
{
  "scripts": {
    "wechat": "node --import tsx scripts/wechat-cli.ts",
    "wechat:export": "node --import tsx scripts/export-wechat-html.ts",
    "wechat:draft": "node --import tsx scripts/publish-wechat-article.ts"
  }
}
```

- [ ] **Step 5: Extend tests for compatibility commands**

```ts
test('publish-wechat-article dry-run remains compatible after cli introduction', () => {
  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'scripts/publish-wechat-article.ts', '--markdown', 'content/posts/from-linear-fitting-to-deep-learning.md', '--dry-run'],
    { cwd: process.cwd(), encoding: 'utf-8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /--html/);
});
```

- [ ] **Step 6: Run targeted automated verification**

Run: `npm test -- scripts/wechat-cli.test.ts scripts/wechat-export.test.ts`

Expected: PASS with all CLI and export tests passing

- [ ] **Step 7: Commit**

```bash
git add scripts/wechat-cli.ts scripts/publish-wechat-article.ts package.json scripts/wechat-export.test.ts scripts/wechat-cli.test.ts
git commit -m "feat: add unified wechat cli toolbox"
```

## Task 5: Full Regression Verification

**Files:**
- Modify: `scripts/wechat-cli.test.ts` (if any missing regression coverage discovered)
- Verify runtime behavior against real article and Chrome session

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`

Expected: PASS with 0 failures

- [ ] **Step 2: Verify prepare output on the real math article**

Run: `npm run wechat -- prepare --post content/posts/from-linear-fitting-to-deep-learning.md`

Expected:
- `.wechat-preview/from-linear-fitting-to-deep-learning/article.html` exists
- `.wechat-preview/from-linear-fitting-to-deep-learning/cover.png` exists if cover is available
- `.wechat-preview/from-linear-fitting-to-deep-learning/publish-state.json` has `prepare.status = success`

- [ ] **Step 3: Verify unified all-in-one publish flow**

Run: `npm run wechat -- all --post content/posts/from-linear-fitting-to-deep-learning.md`

Expected:
- CLI finishes with success output
- draft state records `publish`, `cover`, `verify` as `success`
- verification reports `wordCount > 0`, `hasCover = true`, `hasLatexText = false`

- [ ] **Step 4: Verify retry skips back to the failed step only**

Run:

```bash
node --input-type=module <<'EOF'
import fs from 'node:fs';
const path = '.wechat-preview/from-linear-fitting-to-deep-learning/publish-state.json';
const state = JSON.parse(fs.readFileSync(path, 'utf-8'));
state.steps.cover.status = 'failed';
state.steps.verify.status = 'pending';
fs.writeFileSync(path, JSON.stringify(state, null, 2));
EOF
npm run wechat -- retry --post content/posts/from-linear-fitting-to-deep-learning.md --dry-run
```

Expected:
- output contains `Retry step: cover`
- no mention of rerunning `prepare` or `publish`

- [ ] **Step 5: Commit**

```bash
git add scripts/wechat-cli.test.ts
git commit -m "test: verify wechat cli toolbox regression flow"
```
