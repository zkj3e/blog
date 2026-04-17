---
title: 数学 / 机器学习文章模板
date: YYYY-MM-DD
category: ai
excerpt: 用一句话概括这篇文章要解决的问题。
slug: your-slug
---

> 这是写作模板，不会被自动发布。复制后放到 `content/posts/` 下，再按需修改。

## 问题定义

用 2-4 句话说明：

- 研究对象是什么
- 目标函数或建模目标是什么
- 为什么这件事值得讲

## 符号说明

| 符号 | 含义 | 维度 / 备注 |
| --- | --- | --- |
| $x$ | 单个输入样本 | $\mathbb{R}^{d}$ |
| $X$ | 样本矩阵 | $n \times d$ |
| $\theta$ | 参数向量 | 可按上下文替换 |

## 核心公式

行内公式示例：$f_\theta(x)$

块级公式示例：

$$
\hat{\theta} = \operatorname*{arg\,min}_{\theta} J(\theta)
$$

常用片段：

- 矩阵与向量：

$$
\mathbf{y} = A\mathbf{x}, \qquad Y = XW
$$

- 偏导与梯度：

$$
\frac{\partial J}{\partial \theta_j}, \qquad \nabla_\theta J(\theta)
$$

- 期望、方差、协方差：

$$
\mathbb{E}[X], \qquad \operatorname{Var}(X), \qquad \operatorname{Cov}(X, Y)
$$

- softmax 与交叉熵：

$$
\hat{y}_c = \frac{\exp(z_c)}{\sum_{j=1}^{C} \exp(z_j)}, \qquad
\mathcal{L}_{\text{CE}} = -\sum_{c=1}^{C} y_c \log \hat{y}_c
$$

- 极大似然估计：

$$
\hat{\theta}_{\text{MLE}} = \operatorname*{arg\,max}_{\theta} \sum_{i=1}^{N} \log p(x_i \mid \theta)
$$

- 正态分布：

$$
X \sim \mathcal{N}(\mu, \sigma^2), \qquad
p(x \mid \mu, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

## 推导过程

按步骤拆开，不要把多步推导挤进一行：

$$
\ell(\theta) = \sum_{i=1}^{N} \log p(x_i \mid \theta)
$$

然后说明每一步使用了什么假设、化简或近似。

## 图表说明

如果需要图示，优先使用静态 SVG 或图片，并在图下说明：

- 图表达了什么
- 坐标轴或关键标注是什么意思
- 读者该从图里看出什么结论

## 代码与实验

```python
logits = model(x)
loss = criterion(logits, target)
```

代码块中的 `$...$` 不会被当成数学公式解析。

## 小结

最后一节固定回答三件事：

- 核心结论是什么
- 使用了哪些关键公式
- 下一篇可以自然延伸到哪里
