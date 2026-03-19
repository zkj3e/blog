---
title: 从零搭建并部署 GitHub Pages 技术博客
date: 2025-03-19
category: frontend
excerpt: 使用 React + Vite + TypeScript + Tailwind 搭建博客，通过 gh-pages 发布到 GitHub IO，并解决子路径下资源 404 导致空白页的问题。
---

## 目标

搭建一个部署在 **GitHub Pages**（`username.github.io/repo`）上的技术博客，要求：

- React + TypeScript + Tailwind CSS
- 文章用 Markdown 编写，放在 `content/posts`，构建时生成数据
- 支持分类，分类配置化、易扩展
- 发布后通过 `https://username.github.io/blog/` 正常访问

## 技术选型

| 部分       | 选型 |
|------------|------|
| 框架       | React 18 + TypeScript |
| 构建       | Vite 5 |
| 样式       | Tailwind CSS 3 + @tailwindcss/typography（正文排版） |
| 路由       | React Router 6 |
| 内容       | `content/posts/*.md` + frontmatter，构建脚本用 gray-matter + marked 生成 `public/data/posts.json`、`categories.json` |
| 部署       | 构建产物推到 `gh-pages` 分支，GitHub Pages 从该分支发布 |

## 关键配置

### 1. 子路径 base（重要）

站点在 `https://zkj3e.github.io/blog/`，所有资源必须带前缀 `/blog/`，否则会请求到 `https://zkj3e.github.io/assets/xxx.js` 导致 404，页面空白。

- 在项目根目录建 **`.env.production`**：
  ```
  VITE_BASE=/blog/
  ```
- 在 **`vite.config.ts`** 里用 `loadEnv` 读取，否则构建时可能读不到：
  ```ts
  import { defineConfig, loadEnv } from 'vite';

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const base = env.VITE_BASE || '/';
    return { base, plugins: [react()], /* ... */ };
  });
  ```
- 这样构建出的 `index.html` 里脚本和样式会是 `/blog/assets/xxx.js`、`/blog/assets/xxx.css`，在 GitHub IO 下才能正确加载。

### 2. GitHub Pages 发布源

在仓库 **Settings → Pages** 中：

- **Source**：Deploy from a branch
- **Branch**：`gh-pages`
- **Folder**：`/ (root)`

若选成 main 或其它分支，会看不到新博客或看到旧站。

### 3. 部署命令

安装 `gh-pages`，在 `package.json` 中加：

```json
"scripts": {
  "build": "tsx scripts/build-content.ts && vite build",
  "postbuild": "node -e \"require('fs').copyFileSync('dist/index.html','dist/404.html')\"",
  "deploy": "npm run build && gh-pages -d dist"
}
```

- `postbuild` 把 `index.html` 拷成 `404.html`，这样直接打开 `/blog/post/xxx` 时由 SPA 接管路由。
- 每次更新后执行 `npm run deploy` 即可发布。

## 踩坑：页面空白

**现象**：打开 `https://zkj3e.github.io/blog/` 只有标题「技术博客」，正文空白。

**原因**：构建时没有用到 `VITE_BASE`，`base` 为默认 `/`，资源写成了 `/assets/xxx.js`。在子路径站点下会去请求根域名的 `/assets/`，返回 404，JS/CSS 不加载，React 不渲染。

**解决**：在 `vite.config.ts` 中用 `loadEnv(mode, process.cwd(), '')` 显式加载环境变量，保证 `vite build` 时读到 `.env.production` 里的 `VITE_BASE=/blog/`，再赋给 `base`，重新构建并 `npm run deploy`。

## 小结

- 子路径部署必须配置好 Vite 的 `base`，并用 `loadEnv` 确保生产构建读到 `.env.production`。
- GitHub Pages 的 Source 要选对分支（gh-pages）和目录（root）。
- 复制 `index.html` 为 `404.html` 可保证前端路由直链可用。

后续只需在 `content/posts` 下新增 `.md`，写 frontmatter 与正文，执行 `npm run deploy` 即可更新博客。
