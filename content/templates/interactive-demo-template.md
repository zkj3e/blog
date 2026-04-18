---
title: 交互实验文章模板
date: YYYY-MM-DD
category: ai
excerpt: 用一句话概括这个交互实验帮助读者理解什么。
slug: your-interactive-demo-slug
---

> 适合“读者自己调参数，观察现象变化”的文章。

## 参数说明

列出读者可以调节的参数，以及它们各自控制什么。

## 默认状态

说明默认参数下的初始现象和预期结论。

## 交互实验

使用 demo 短代码挂载交互组件：

{{< demo name="gradient-descent" title="交互演示标题" note="告诉读者该重点观察什么。" autoplay="false" >}}

## 动态结果

解释：

- 参数增大时发生什么
- 参数减小时发生什么
- 哪种现象说明系统进入了不同阶段

## 现象解释

用公式或结构图把交互现象和理论连接起来。
