---
title: 优化过程动态工具箱：用动画展示梯度下降、收敛速度与学习率影响
date: 2026-04-17
category: ai
excerpt: 一篇面向机器学习写作的动态工具箱基准页，展示如何用 SVG 动画和交互 demo 表达梯度下降与 loss 收敛过程。
slug: optimization-animation-toolkit
---

这篇文章是动态表达工具箱的第一篇基准页，目标不是替代公式，而是把“量如何变化”也展示出来。对于优化类内容，最值得动态表达的通常有三件事：

- 参数点怎样沿着损失曲线移动
- loss 怎样随着步数下降
- 学习率变大或变小时，轨迹会怎样改变

## 静态公式先定义变化对象

对一维目标函数 $J(\theta)=\theta^2$，梯度下降更新写作：

$$
\theta_{t+1} = \theta_t - \eta \nabla_\theta J(\theta_t)
$$

因为

$$
\nabla_\theta J(\theta)=2\theta
$$

所以更新可以展开为：

$$
\theta_{t+1} = (1 - 2\eta)\theta_t
$$

这个写法直接揭示了学习率 $\eta$ 的作用：它控制参数点向最小值 $\theta = 0$ 靠近的速度，也决定过程是否会振荡。

## 轻量动画适合直接嵌进文章

下面这个 SVG 只靠文章内嵌 HTML 和 CSS 就能工作，适合表达“点沿着曲线逐步下降”这种教学型变化过程：

<figure class="dynamic-figure">
  <svg viewBox="0 0 720 360" role="img" aria-label="梯度下降沿损失曲线逐步逼近最小值的动画示意">
    <defs>
      <linearGradient id="optim-surface" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#f8fafc"></stop>
        <stop offset="100%" stop-color="#dbeafe"></stop>
      </linearGradient>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12"></feDropShadow>
      </filter>
    </defs>
    <rect x="0" y="0" width="720" height="360" rx="28" fill="url(#optim-surface)"></rect>
    <line x1="80" y1="286" x2="644" y2="286" stroke="#94a3b8" stroke-width="2"></line>
    <line x1="360" y1="64" x2="360" y2="294" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="7 9"></line>
    <path d="M 100 286 C 188 220, 250 128, 320 86 C 342 74, 352 70, 360 70 C 368 70, 378 74, 400 86 C 470 128, 532 220, 620 286" fill="none" stroke="#0f766e" stroke-width="8" stroke-linecap="round"></path>
    <path d="M 150 222 L 258 136 L 334 92 L 360 70" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 14">
      <animate attributeName="stroke-dashoffset" from="120" to="0" dur="2.4s" repeatCount="indefinite"></animate>
    </path>
    <circle cx="150" cy="222" r="10" fill="#2563eb" filter="url(#soft-shadow)">
      <animate attributeName="cx" values="150;258;334;360;360" dur="2.4s" repeatCount="indefinite"></animate>
      <animate attributeName="cy" values="222;136;92;70;70" dur="2.4s" repeatCount="indefinite"></animate>
    </circle>
    <circle cx="360" cy="70" r="16" fill="none" stroke="#fb923c" stroke-width="3" stroke-dasharray="4 6">
      <animate attributeName="r" values="12;18;12" dur="1.8s" repeatCount="indefinite"></animate>
      <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1.8s" repeatCount="indefinite"></animate>
    </circle>
    <text x="150" y="252" text-anchor="middle" font-size="20" fill="#334155">θ₀</text>
    <text x="252" y="117" text-anchor="middle" font-size="20" fill="#334155">θ₁</text>
    <text x="334" y="74" text-anchor="middle" font-size="20" fill="#334155">θ₂</text>
    <text x="360" y="330" text-anchor="middle" font-size="24" fill="#0f172a">minimum at θ = 0</text>
  </svg>
  <figcaption>轻量动画适合表示“参数点沿曲线向最小值逼近”的连续变化，不要求读者操作也能理解过程。</figcaption>
</figure>

这个层级的动画适合绝大多数文章，因为它成本低、版本可控，而且在无法交互的环境里仍然保留完整的静态信息。

## 交互 demo 适合解释参数如何改变过程

当文章要回答“如果学习率变大，会发生什么”时，仅靠自动播放动画通常不够。更好的做法是让读者调节参数，自己观察轨迹变化：

{{< demo name="gradient-descent" title="梯度下降交互演示" note="拖动学习率，观察参数点如何沿着损失曲线向最小值移动。" autoplay="true" >}}

这类 demo 更适合承载两种内容：

- 过程对比：同一目标函数下，不同学习率的收敛速度区别
- 参数敏感性：超参数变化后，轨迹是更平滑还是更振荡

## 写作时的动态表达规范

写优化类文章时，建议固定回答这三个问题：

| 问题 | 文章里应该怎么表现 |
| --- | --- |
| 这个量在变什么 | 先用公式明确变量、目标函数和更新式 |
| 读者该观察什么 | 明确指出看轨迹、看 loss、还是看收敛速度 |
| 动画和公式如何对应 | 在图示旁边写出变量名和关键结论，避免动画沦为装饰 |

推荐的组织顺序是：

1. 先给静态公式，锁定变量和目标。
2. 再给轻量动画，展示连续变化。
3. 最后给交互 demo，让读者自己调参数验证现象。

## 小结

优化过程是最适合率先做成动态工具箱的主题，因为它天然有“状态随时间变化”的结构。以后写 learning rate、momentum、Adam、正则化或收敛性直觉时，都可以直接复用这一套表达方式。
