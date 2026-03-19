---
title: 欢迎来到技术博客
date: 2025-03-19
category: misc
excerpt: 这是一篇示例文章，后续只需在 content/posts 下新增 .md 文件并执行构建即可发布。
---

## 使用方式

1. 在 `content/posts` 目录下新建 `.md` 文件。
2. 在文件顶部填写 frontmatter：
   - `title`: 标题
   - `date`: 日期（如 2025-03-19）
   - `category`: 分类 id（与 `content/categories.json` 中的 id 一致）
   - `excerpt`: 可选，列表摘要
3. 执行 `npm run build` 后部署即可。

## 扩展分类

在 `content/categories.json` 中新增一项，例如：

```json
{
  "id": "ai",
  "name": "AI",
  "description": "人工智能与机器学习"
}
```

然后在文章 frontmatter 中设置 `category: ai` 即可。

支持 **Markdown** 与 `代码` 以及 GFM 表格等。

| 列1 | 列2 |
|-----|-----|
| A   | B   |

祝写作愉快。
