---
title: 动态推导文章模板
date: YYYY-MM-DD
category: ai
excerpt: 用一句话概括这篇文章想解释的变化过程。
slug: your-dynamic-post-slug
---

> 适合“先给公式，再展示变化过程”的文章。

## 问题背景

说明：

- 哪个量会随时间、步数或参数变化
- 读者为什么需要看这个变化过程

## 静态公式

先用公式锁定对象：

$$
\theta_{t+1} = \theta_t - \eta \nabla_\theta J(\theta_t)
$$

## 轻量动画图示

优先使用可内嵌 SVG：

<figure class="dynamic-figure">
  <svg viewBox="0 0 720 320" role="img" aria-label="变化过程示意图">
    <rect x="0" y="0" width="720" height="320" fill="#eff6ff"></rect>
    <text x="360" y="160" text-anchor="middle" font-size="28" fill="#334155">
      在这里放变化过程动画
    </text>
  </svg>
  <figcaption>说明这个动画中的变量、方向和结论。</figcaption>
</figure>

## 关键观察

- 变化最快的阶段是什么
- 哪个参数最影响过程形态
- 动画里的关键现象如何对应到公式

## 小结

固定回答：

- 这个量在变什么
- 读者应该从动画里看到什么
- 下一篇可以扩展到哪个更复杂的过程
