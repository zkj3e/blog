# 技术博客（GitHub Pages）

基于 **React + Vite + TypeScript + Tailwind CSS** 的极简技术博客，支持分类、Markdown 发布与数学公式写作。

## 功能

- **TypeScript** 全栈类型安全
- **Tailwind CSS** 样式，支持深色/浅色主题（`darkMode: 'class'`）
- 标准 **LaTeX 数学公式**：行内 `$...$`、块级 `$$...$$`
- 支持文章内嵌 **动态 SVG 动画** 与 **交互 demo 占位块**
- 分类展示，分类通过 `content/categories.json` 配置，易扩展
- 在 `content/posts` 下新增 `.md` 文件即可发布

## 本地开发

```bash
npm install
npm run build   # 会先执行构建脚本生成 data，再构建前端
npm run dev     # 开发时自动执行 content 脚本后启动 Vite
```

开发时若修改了 `content/posts` 下的 MD，需重新执行一次内容构建或重新 `npm run dev`：

```bash
npm run content
npm run dev
```

## 发布新文章

1. 在 `content/posts` 下新建 `.md` 文件。
2. 在文件顶部写 frontmatter：

```yaml
---
title: 文章标题
date: 2025-03-19
category: frontend   # 与 categories.json 中的 id 一致
excerpt: 可选，列表摘要
---
```

3. 执行 `npm run build` 后部署 `dist` 目录。

### 数学公式写法

- 行内公式：`$\\nabla_\\theta J(\\theta)$`
- 块级公式：

```tex
$$
\\mathcal{L}(\\theta) = -\\sum_{i=1}^{N} y_i \\log \\hat{y}_i
$$
```

- 普通 Markdown、GFM 表格、代码块和数学公式可以混写。
- fenced code block 中的 `$...$` 不会被当作公式解析。
- 可复用模板见 `content/templates/math-ml-post-template.md`。
- 动态文章模板见 `content/templates/dynamic-math-post-template.md` 与 `content/templates/interactive-demo-template.md`。

### 动态 demo 写法

在 Markdown 里使用短代码嵌入交互组件：

```md
{{< demo name="gradient-descent" title="梯度下降交互演示" note="观察学习率变化。" autoplay="true" >}}
```

当前内置 demo：

- `gradient-descent`：展示参数点沿损失曲线向最小值移动，并支持调节学习率。

## 扩展分类

在 `content/categories.json` 中新增一项，例如：

```json
{
  "id": "ai",
  "name": "AI",
  "description": "人工智能与机器学习"
}
```

在文章 frontmatter 中设置 `category: ai` 即可。

## 部署到 GitHub Pages

### 方式一：推送到 gh-pages 分支

1. 若仓库名为 `blog`，且使用 `username.github.io/blog` 访问，在项目根目录创建 `.env.production`：
   ```
   VITE_BASE=/blog/
   ```
2. 安装并配置 gh-pages（可选）：
   ```bash
   npm i -D gh-pages
   ```
   在 `package.json` 的 `scripts` 中增加：
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
   然后执行 `npm run deploy`。

### 方式二：GitHub Actions

在仓库中创建 `.github/workflows/deploy.yml`，使用 `peaceiris/actions-gh-pages` 等 Action，在每次 push 时构建并部署 `dist`。

### SPA 路由与 404

构建完成后会自动将 `dist/index.html` 复制为 `dist/404.html`。部署到 GitHub Pages 后，当用户直接访问 `/post/xxx` 等子路径时，服务器会返回 404 页面（即我们的 SPA），React Router 会根据当前 URL 正确渲染对应页面。

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5**
- **React Router 6**
- **Tailwind CSS 3** + **@tailwindcss/typography**（文章正文样式）
- 构建阶段：**gray-matter** + **remark/rehype** 管线解析 Markdown 与数学公式，输出 `public/data/posts.json` 与 `public/data/categories.json`
- 构建脚本：**tsx** 运行 `scripts/build-content.ts`

## 计划与需求

详见 [PLAN.md](./PLAN.md)。
