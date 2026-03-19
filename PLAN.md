# GitHub Pages 技术博客 - 需求与实施计划

## 一、需求清单

| 序号 | 需求 | 说明 |
|------|------|------|
| 1 | 风格选择 | 选定一套适合技术博客的视觉与交互风格 |
| 2 | 分类功能 | 文章按分类展示，支持筛选 |
| 3 | 易扩展分类 | 新增分类无需改核心代码，配置即可 |
| 4 | React 架构 | 使用 React 构建 SPA，便于维护与扩展 |
| 5 | MD 即发布 | 在指定目录新增 `.md` 文件并构建即可发布 |

---

## 二、风格选择

**选定风格：极简技术博客（Minimal Tech Blog）**

- **语言与样式**：TypeScript 实现，Tailwind CSS 负责样式
- **配色**：深色/浅色双主题（Tailwind `dark:` 与 `class` 模式），主色蓝/灰，代码块清晰
- **排版**：Tailwind 工具类 + `@tailwindcss/typography` 文章正文
- **布局**：顶部导航、列表+详情，移动端友好

---

## 三、功能设计

### 3.1 分类系统

- **数据来源**：`content/categories.json` 定义分类 id、名称、描述、顺序
- **文章归属**：每篇 MD 的 frontmatter 中 `category: <id>` 指定分类
- **扩展方式**：在 `categories.json` 新增一项，并在新文章中引用即可

### 3.2 文章与 MD 发布流程

- **文章存放**：`content/posts/*.md`
- **Frontmatter 约定**：`title`、`date`、`category`、`slug`（可选，默认用文件名）
- **构建时**：`scripts/build-content.ts`（TypeScript）读取 MD 与分类，解析后输出 `public/data/posts.json`、`public/data/categories.json`
- **发布**：执行 `npm run build` 后部署 `dist` 即可

### 3.3 路由结构

- `/` 首页（最新文章列表）
- `/category/:id` 某分类下的文章列表
- `/post/:slug` 文章详情（MD 转 HTML 渲染）

---

## 四、技术架构

- **框架**：React 18 + TypeScript
- **构建**：Vite 5
- **路由**：React Router v6
- **样式**：Tailwind CSS 3 + @tailwindcss/typography
- **Markdown**：构建阶段 gray-matter + marked 解析，输出 JSON；构建脚本为 TypeScript（tsx 运行）
- **部署**：GitHub Pages，build 后复制 `index.html` 为 `404.html` 以支持 SPA 直链

---

## 五、实施步骤（建议顺序）

1. **初始化项目**：Vite + React + TypeScript，配置 Tailwind、base 与 build 输出
2. **内容模型**：`content/categories.json`、`content/posts` 及示例 MD
3. **构建脚本**：`scripts/build-content.ts` 读取 MD 与分类，输出 `public/data/*.json`
4. **React 页面**：首页、分类页、文章详情页，从生成数据读取
5. **样式与主题**：Tailwind 工具类 + 深色模式（class）
6. **部署**：GitHub Pages 与（可选）GitHub Actions

---

## 六、后续扩展

- 标签（tags）与多分类
- 全文搜索（静态 JSON 或 Algolia）
- 评论（如 Giscus）
- RSS 生成

---

*当前已按 TypeScript + Tailwind 实现并更新本文档。*
