# AI Skills 实战指南：从定义到编写与案例解析

这份文档先回答两个核心问题：

- Skills 是什么
- 如何写一个好的 Skills

最后再放两个仓库的案例解析，便于按需查阅。

---

## 一、Skills 是什么

`Skills` 可以理解成“给 AI 的可复用执行手册”：

- 不是单条提示词，而是一整套可触发、可执行、可检查的流程。
- 通常会定义：何时触发、输入要求、执行步骤、约束、输出标准、结束检查。
- 目标是把“偶尔有效”的对话，变成“稳定复现”的工作流。

一个好的 skill 往往有这三个特征：

- 可判定：什么时候该用、什么时候不该用，一眼可判断。
- 可执行：步骤具体、可操作，不是空泛原则。
- 可验收：产物和质量标准清晰，可自检。

---

## 二、如何写一个好的 Skills（实战清单）

### 1) 触发描述要“可判定”

- 好：写清“什么时候触发 + 什么时候不要触发”。
- 差：只写“用于开发任务”这种大而泛描述。

### 2) 指令要“流程化”

- 按步骤写：`输入识别 -> 执行步骤 -> 校验 -> 输出`。
- 每一步都尽量是可操作动作，不要只写口号。

### 3) 输出要“标准化”

- 规定输出文件类型、命名、结构。
- 规定失败时的回退行为（重试、提问、报错）。

### 4) 约束要“前置”

- 明确风险操作限制（如 git、删除、覆盖）。
- 明确性能边界（大文件分批、先摘要后细化）。

### 5) 示例要“贴近真实请求”

- 给 2-3 个真实触发例子（不是玩具例子）。
- 至少给 1 个反例（说明何时不该触发）。

### 6) 可评估性

- 结果尽量可检查：是否生成文件、是否满足结构、是否通过命令。
- 主观任务至少给 checklist。

---

## 三、Skill 收尾怎么写（结束段模板）

很多 skill 前面写得很好，但最后不稳定，常见原因是“收尾没定义清楚”。

建议在 `SKILL.md` 末尾固定一个 `Final Step`，至少包含这 4 点：

- 交付物确认：明确输出内容和命名规则。
- 质量检查：结束前自检，若失败先修复再返回。
- 边界声明：不做无关改动，不做破坏性操作；信息不足先提问。
- 最终输出格式：规定回复结构与简洁程度。

可直接复用：

```markdown
## Final Step

Before finishing:
- Verify outputs exist and match requested format.
- Run a quick self-check for completeness and obvious errors.
- If anything is missing or invalid, fix it before returning.

Final response must include:
1. What was produced
2. Where the output is located
3. Any assumptions or follow-up actions
```

---

## 四、如何 Add Skill（安装与接入）

### A) 从 `mattpocock/skills` 添加单个 skill

```bash
npx skills@latest add mattpocock/skills/tdd
```

把 `tdd` 替换成目标目录名即可，例如：

- `write-a-prd`
- `prd-to-plan`
- `triage-issue`

仓库：<https://github.com/mattpocock/skills>

### B) 从 `anthropics/skills` 以 marketplace 安装（Claude Code）

先添加 marketplace：

```bash
/plugin marketplace add anthropics/skills
```

再安装插件包（示例）：

```bash
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

仓库：<https://github.com/anthropics/skills>

### C) 安装后的验证建议

1. 先给一个明确触发请求，确认 skill 被调用。
1. 检查输出是否符合约束（格式、文件、步骤）。
1. 若触发不稳定，优先优化 `description` 中的触发/反触发条件。

---

## 五、推荐的 Skill 骨架（可直接起步）

```markdown
---
name: your-skill-name
description: 这个 skill 做什么；何时触发；何时不要触发。
---

# Skill Name

## When to Use
- 触发条件 1
- 触发条件 2
- 不触发条件

## Inputs
- 需要哪些输入
- 输入缺失时如何处理

## Workflow
1. 步骤一
2. 步骤二
3. 步骤三

## Output
- 输出格式
- 文件命名
- 质量标准

## Final Step
- 完成前检查
- 失败回退策略
- 最终回复结构
```

---

## 六、快速选型建议

### 偏工程落地

- 优先：`tdd`、`triage-issue`、`setup-pre-commit`、`webapp-testing`

### 偏产品规划

- 优先：`write-a-prd`、`prd-to-plan`、`prd-to-issues`

### 偏文档与办公产物

- 优先：`docx`、`pdf`、`pptx`、`xlsx`、`doc-coauthoring`

### 偏技能沉淀

- 优先：`write-a-skill`、`skill-creator`、`mcp-builder`

---

## 七、两个例子的解析

本文档汇总两个仓库：

- `anthropics/skills`
- `mattpocock/skills`

目标：提供可快速检索的中文说明（每个 skill 做什么、适用场景是什么）。

### 7.1 Anthropic Skills（`anthropics/skills`）

仓库地址：<https://github.com/anthropics/skills>

- `algorithmic-art`：p5.js 算法艺术（seed 可复现、参数探索、交互展示）。
- `brand-guidelines`：品牌视觉规范落地。
- `canvas-design`：高质量静态视觉设计（偏 `.png/.pdf`）。
- `claude-api`：Claude API/SDK 开发指南。
- `doc-coauthoring`：文档共创流程化方法。
- `docx`：Word 创建/编辑/解析。
- `frontend-design`：高审美前端 UI 设计实现。
- `internal-comms`：企业内部沟通模板化写作。
- `mcp-builder`：MCP Server 设计与实现指南。
- `pdf`：PDF 全流程处理。
- `pptx`：PPT 创建/编辑/解析与视觉 QA。
- `skill-creator`：创建和优化 skill 本身。
- `slack-gif-creator`：Slack GIF 生成与优化。
- `theme-factory`：主题工厂（预置 + 自定义）。
- `web-artifacts-builder`：复杂 Web Artifact 构建。
- `webapp-testing`：Playwright 自动化测试与调试。
- `xlsx`：表格文件处理（`.xlsx/.xlsm/.csv/.tsv`）。

### 7.2 Matt Pocock Skills（`mattpocock/skills`）

仓库地址：<https://github.com/mattpocock/skills>

- `write-a-prd`：访谈 + 代码探索生成 PRD。
- `prd-to-plan`：PRD 转分阶段实施计划。
- `prd-to-issues`：PRD 拆解为并行 issue。
- `grill-me`：高强度追问式方案审查。
- `design-an-interface`：并行产出接口方案并比较。
- `request-refactor-plan`：生成小步可提交重构计划。
- `tdd`：红-绿-重构循环开发。
- `triage-issue`：问题排查、根因定位、修复建议。
- `improve-codebase-architecture`：识别架构改进点。
- `migrate-to-shoehorn`：迁移 TS 测试断言到 shoehorn。
- `scaffold-exercises`：生成练习题目录结构。
- `setup-pre-commit`：搭建 pre-commit 质量门禁。
- `git-guardrails-claude-code`：拦截高风险 git 命令。
- `write-a-skill`：指导编写新 skill。
- `edit-article`：文章结构和表达优化。
- `ubiquitous-language`：提炼 DDD 统一语言术语。
- `obsidian-vault`：管理 Obsidian 知识库。
