---
title: 数学与机器学习写作工具箱：公式、矩阵、梯度、交叉熵与正态分布
date: 2026-04-17
category: ai
excerpt: 一篇可直接复用的数学排版示例文章，覆盖矩阵乘法、梯度、交叉熵、极大似然估计与正态分布图示。
slug: math-ml-formula-toolkit
---

这篇文章是博客里的数学写作基准页，用来验证并展示：

- 行内公式与块级公式
- 数学公式、代码块、表格混排
- 机器学习常见表达的推荐写法
- 静态 SVG 图示在文章中的嵌入方式

## 数学排版总览

以后写数学和机器学习相关文章时，直接使用标准 LaTeX 语法即可：

- 行内公式：$f(x) = x^2$
- 块级公式：

$$
\operatorname*{arg\,min}_{\theta} J(\theta)
$$

如果要同时插入代码块，也可以直接写。代码块中的 `$...$` 不会被当成数学公式：

```python
equation = "$x^T W y$"
print(equation)
```

## 线性代数示例

矩阵乘法是机器学习文章里最常出现的表达之一。设输入矩阵为 $X \in \mathbb{R}^{n \times d}$，权重矩阵为 $W \in \mathbb{R}^{d \times k}$，则线性变换可以写为：

$$
Y = XW
$$

如果把它展开到元素级别，则第 $i$ 行第 $j$ 列元素为：

$$
Y_{ij} = \sum_{t=1}^{d} X_{it} W_{tj}
$$

常见的列向量形式也可以写成：

$$
\mathbf{y} = A\mathbf{x}
$$

如果换到 Transformer 的 self-attention 语境里，通常会先把一段序列的 token 表示堆成一个输入矩阵。设第 $i$ 个 token 的表示为 $x_i \in \mathbb{R}^{d}$，则：

$$
X =
\begin{bmatrix}
x_1^\top \\
x_2^\top \\
\vdots \\
x_n^\top
\end{bmatrix}
\in \mathbb{R}^{n \times d}
$$

其中 $n$ 是序列长度，$d$ 是 embedding 维度。接着用三组不同的投影矩阵生成 Query、Key 和 Value：

$$
W_Q, W_K \in \mathbb{R}^{d \times d_k},
\qquad
W_V \in \mathbb{R}^{d \times d_v}
$$

$$
\color{blue}{Q} = X W_Q =
\begin{bmatrix}
\color{blue}{q_1^\top} \\
\color{blue}{q_2^\top} \\
\vdots \\
\color{blue}{q_n^\top}
\end{bmatrix},
\qquad
\color{green}{K} = X W_K =
\begin{bmatrix}
\color{green}{k_1^\top} \\
\color{green}{k_2^\top} \\
\vdots \\
\color{green}{k_n^\top}
\end{bmatrix},
\qquad
\color{orange}{V} = X W_V =
\begin{bmatrix}
\color{orange}{v_1^\top} \\
\color{orange}{v_2^\top} \\
\vdots \\
\color{orange}{v_n^\top}
\end{bmatrix}
$$

于是 scaled dot-product attention 可以写成：

$$
\operatorname{Attention}(\color{blue}{Q}, \color{green}{K}, \color{orange}{V})
=
\operatorname{softmax}\left(
\frac{\color{blue}{Q}\color{green}{K}^\top}{\sqrt{d_k}}
\right)\color{orange}{V}
$$

这个写法的好处是，读者能先看到输入矩阵里具体由 $x_1, x_2, \dots, x_n$ 组成，再理解它们如何分别映射成不同语义角色的 $\color{blue}{Q}$、$\color{green}{K}$、$\color{orange}{V}$。

| 符号 | 维度 | 含义 |
| --- | --- | --- |
| $X$ | $n \times d$ | 样本矩阵 |
| $W$ | $d \times k$ | 参数矩阵 |
| $Y$ | $n \times k$ | 输出矩阵 |

## 微积分与梯度示例

当目标函数为 $J(\theta)$ 时，偏导与梯度通常写成：

$$
\frac{\partial J}{\partial \theta_j}
$$

以及

$$
\nabla_{\theta} J(\theta) =
\begin{bmatrix}
\frac{\partial J}{\partial \theta_1} \\
\frac{\partial J}{\partial \theta_2} \\
\vdots \\
\frac{\partial J}{\partial \theta_m}
\end{bmatrix}
$$

在梯度下降中，参数更新公式可以写为：

$$
\theta^{(t+1)} = \theta^{(t)} - \eta \nabla_{\theta} J\left(\theta^{(t)}\right)
$$

其中 $\eta$ 是学习率，$\nabla_{\theta} J(\theta)$ 表示当前参数点处的梯度。

## 概率与统计示例

一维正态分布的概率密度函数写作：

$$
p(x \mid \mu, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

如果记随机变量为 $X$，则可写为：

$$
X \sim \mathcal{N}(\mu, \sigma^2)
$$

在机器学习里，期望和方差也很常见：

$$
\mathbb{E}[X] = \mu, \qquad \operatorname{Var}(X) = \sigma^2
$$

## 损失函数与极大似然示例

对于多分类任务，预测分布为 $\hat{\mathbf{y}}$、真实标签为 one-hot 向量 $\mathbf{y}$ 时，交叉熵损失常写为：

$$
\mathcal{L}_{\text{CE}}(\mathbf{y}, \hat{\mathbf{y}})
= -\sum_{c=1}^{C} y_c \log \hat{y}_c
$$

如果配合 softmax 输出，则

$$
\hat{y}_c = \frac{\exp(z_c)}{\sum_{j=1}^{C} \exp(z_j)}
$$

极大似然估计的目标通常写成：

$$
\hat{\theta}_{\text{MLE}} = \operatorname*{arg\,max}_{\theta} \prod_{i=1}^{N} p(x_i \mid \theta)
$$

在实际推导中，通常先转成对数似然：

$$
\ell(\theta) = \log \prod_{i=1}^{N} p(x_i \mid \theta)
= \sum_{i=1}^{N} \log p(x_i \mid \theta)
$$

于是估计量也可以写为：

$$
\hat{\theta}_{\text{MLE}} = \operatorname*{arg\,max}_{\theta} \ell(\theta)
$$

## 图示示例与写作建议

下面是一个可直接嵌入 Markdown 的静态 SVG 图示，适合放在概率分布、函数曲线、几何示意这类文章里：

<figure class="math-figure">
  <svg viewBox="0 0 720 360" role="img" aria-label="正态分布曲线示意图">
    <defs>
      <linearGradient id="curve-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.04"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="360" fill="#f8fafc"></rect>
    <line x1="80" y1="290" x2="640" y2="290" stroke="#94a3b8" stroke-width="2"></line>
    <line x1="360" y1="80" x2="360" y2="310" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8 8"></line>
    <path d="M 80 290 C 170 290, 220 260, 280 180 C 320 125, 345 95, 360 90 C 375 95, 400 125, 440 180 C 500 260, 550 290, 640 290 L 640 290 L 80 290 Z" fill="url(#curve-fill)"></path>
    <path d="M 80 290 C 170 290, 220 260, 280 180 C 320 125, 345 95, 360 90 C 375 95, 400 125, 440 180 C 500 260, 550 290, 640 290" fill="none" stroke="#0f766e" stroke-width="6" stroke-linecap="round"></path>
    <text x="360" y="70" text-anchor="middle" font-size="24" fill="#0f172a">Normal Distribution</text>
    <text x="360" y="325" text-anchor="middle" font-size="22" fill="#475569">μ</text>
    <text x="138" y="325" text-anchor="middle" font-size="18" fill="#64748b">μ - 2σ</text>
    <text x="250" y="325" text-anchor="middle" font-size="18" fill="#64748b">μ - σ</text>
    <text x="470" y="325" text-anchor="middle" font-size="18" fill="#64748b">μ + σ</text>
    <text x="582" y="325" text-anchor="middle" font-size="18" fill="#64748b">μ + 2σ</text>
  </svg>
  <figcaption>正态分布静态图示示例：峰值位于均值 μ 附近，曲线宽度由标准差 σ 控制。</figcaption>
</figure>

推荐的写作约定：

- 公式尽量使用语义清晰的符号，如 $\mathcal{L}$、$\ell$、$\mathbb{E}$、$\operatorname{Var}$。
- 长公式使用块级写法，避免行内公式把段落撑乱。
- 图示优先用静态 SVG，便于版本管理与文章复用。
- 同一篇文章内，统一符号命名，不要在中途切换 $\theta / w / \beta$ 的角色含义。

## 小结

这篇文章可以直接作为以后写数学和机器学习博客时的参考页。需要新的常用表达时，只要继续往模板和示例库里补即可，不需要再改渲染链路。
