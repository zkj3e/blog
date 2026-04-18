---
title: 从线性拟合到深度学习：为什么模型会一层层变深
date: 2026-04-18
category: ai
excerpt: 以函数拟合为主线，解释为什么我们会从线性回归走到基函数模型、单层神经网络，再自然走向深度学习。
slug: from-linear-fitting-to-deep-learning
---

很多人在第一次接触机器学习时，会把线性回归、神经网络、深度学习看成三类几乎彼此独立的模型。这样学并不算错，但容易看不出它们之间真正的连续性。  
从“拟合函数”出发，这条演化路径其实很简单：先拟合直线，再拟合更灵活的折线，再把这些折线组织成分层表示。

本文只围绕一个问题展开：

$$
\min_{\theta} \sum_{i=1}^{n} \bigl(y_i - f_{\theta}(x_i)\bigr)^2
$$

其中 $(x_i, y_i)$ 是观测数据，$f_\theta$ 是我们试图学习的函数，$\theta$ 是模型参数。无论模型名字怎么变，核心任务都没有变：我们希望找到一个函数，使它在样本点上尽可能接近真实关系。

## 拟合问题的统一表述

如果用一个更机器学习的简化框架来讲，监督学习通常可以拆成三个要素：

- 模型：给定输入 $x$，如何输出预测 $\hat{y}=f_\theta(x)$
- 损失函数：预测和真实值之间差多少
- 监督数据：一组带标签样本 $(x_i, y_i)$

写成最基础的回归问题，就是：

$$
\hat{y}_i = f_\theta(x_i)
$$

以及

$$
\mathcal{L}(y_i, \hat{y}_i) = (y_i - \hat{y}_i)^2
$$

于是整个训练目标可以统一写成

$$
\hat{\theta}
=
\operatorname*{arg\,min}_{\theta}
\sum_{i=1}^{n} \mathcal{L}\bigl(y_i, f_\theta(x_i)\bigr)
$$

在本文这个拟合主线下，损失函数和监督数据都不变，真正持续升级的是“模型”这一项，也就是 $f_\theta(x)$ 到底允许长成什么样。  
后面各节只回答一件事：模型形式为什么会一步步变强。

## 第一阶段：线性拟合为什么自然，但很快就不够

最简单的想法，是先从一次函数开始：

$$
f(x) = ax + b
$$

这就是一维线性拟合。优点只有三个字：简单、清楚、好解。

如果输入是多维向量 $x \in \mathbb{R}^d$，写法就变成

$$
f(x) = w^\top x + b
$$

其中 $w \in \mathbb{R}^d$。如果把所有样本堆成矩阵 $X \in \mathbb{R}^{n \times d}$，输出向量记为 $y \in \mathbb{R}^n$，则模型可以写成

$$
\hat{y} = Xw + b\mathbf{1}
$$

本质上，我们把候选函数限制在最简单的二维空间 $\{1, x\}$ 里。这样做很自然，但也立刻带来限制：真实关系一旦弯起来，直线就不够了。

<figure class="math-figure">
  <svg viewBox="0 0 720 360" role="img" aria-label="线性拟合面对弯曲数据时误差较大的示意图">
    <defs>
      <linearGradient id="linear-fit-bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#f8fafc"></stop>
        <stop offset="100%" stop-color="#e0f2fe"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="360" fill="url(#linear-fit-bg)"></rect>
    <line x1="84" y1="292" x2="640" y2="292" stroke="#94a3b8" stroke-width="2"></line>
    <line x1="92" y1="56" x2="92" y2="304" stroke="#94a3b8" stroke-width="2"></line>
    <path d="M 120 250 C 190 220, 250 168, 320 126 C 372 96, 428 92, 484 126 C 548 164, 590 212, 620 246" fill="none" stroke="#0f766e" stroke-width="8" stroke-linecap="round"></path>
    <line x1="128" y1="226" x2="620" y2="164" stroke="#2563eb" stroke-width="6" stroke-linecap="round"></line>
    <circle cx="140" cy="245" r="8" fill="#0f766e"></circle>
    <circle cx="198" cy="212" r="8" fill="#0f766e"></circle>
    <circle cx="248" cy="176" r="8" fill="#0f766e"></circle>
    <circle cx="310" cy="132" r="8" fill="#0f766e"></circle>
    <circle cx="376" cy="104" r="8" fill="#0f766e"></circle>
    <circle cx="440" cy="114" r="8" fill="#0f766e"></circle>
    <circle cx="506" cy="146" r="8" fill="#0f766e"></circle>
    <circle cx="570" cy="198" r="8" fill="#0f766e"></circle>
    <circle cx="618" cy="240" r="8" fill="#0f766e"></circle>
    <line x1="376" y1="104" x2="376" y2="194" stroke="#f97316" stroke-width="3" stroke-dasharray="7 7"></line>
    <text x="504" y="92" font-size="24" fill="#0f172a">真实关系</text>
    <text x="472" y="192" font-size="22" fill="#1d4ed8">线性拟合</text>
    <text x="390" y="154" font-size="18" fill="#ea580c">局部误差变大</text>
  </svg>
  <figcaption>当真实关系是弯曲的时，一条直线只能给出全局平均意义上的近似，很难同时兼顾不同区间的局部结构。</figcaption>
</figure>

## 第二阶段：从线性拟合过渡到可学习的非线性基

再往前走一步，只需要一个过渡想法：先做特征变换，再线性组合。写成公式就是

$$
f(x) = \sum_{j=1}^{m} \beta_j \phi_j(x)
$$

关键只是：线性的对象从“原始输入”变成了“变换后的特征”。  
神经网络接下来多做的一步，就是连这些特征本身也一起学习。

## 第三阶段：单层神经网络其实是可学习的基函数模型

单隐层神经网络在回归问题里通常写成：

$$
f(x) = \sum_{j=1}^{m} a_j \,\sigma(w_j^\top x + b_j) + c
$$

这和上一节非常接近。区别只在于，第 $j$ 个基函数不再预先固定，而是

$$
\phi_j(x) = \sigma(w_j^\top x + b_j)
$$

也就是说，神经网络没有放弃基函数思想，只是把“选什么基函数”也变成了学习问题。  
在线性基函数模型里，我们只能学习系数 $\beta_j$；在单层神经网络里，我们同时学习：

- 每个基函数的方向 $w_j$
- 每个基函数的平移 $b_j$
- 每个基函数最终被组合时的权重 $a_j$

所以单层网络可以理解成“自适应基函数展开”。  
其中 ReLU 最值得单独拿出来讲，因为它把“神经网络”和“分段线性拟合”之间的关系写得最直接。

<figure class="math-figure">
<svg viewBox="0 0 720 360" role="img" aria-label="单隐层神经网络把输入映射到一组并列隐藏单元，再组合成输出的示意图">
<defs><linearGradient id="single-net-bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f8fafc"></stop><stop offset="100%" stop-color="#eff6ff"></stop></linearGradient></defs>
<rect x="0" y="0" width="720" height="360" fill="url(#single-net-bg)"></rect>
<text x="360" y="38" text-anchor="middle" font-size="28" fill="#0f172a">单层神经网络：并列生成可学习特征，再做一次组合</text>
<circle cx="110" cy="182" r="30" fill="#dbeafe" stroke="#2563eb" stroke-width="3"></circle>
<text x="110" y="190" text-anchor="middle" font-size="24" fill="#1d4ed8">x</text>
<circle cx="280" cy="92" r="28" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="280" cy="152" r="28" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="280" cy="212" r="28" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="280" cy="272" r="28" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<text x="280" y="100" text-anchor="middle" font-size="18" fill="#0f172a">σ(w₁x+b₁)</text>
<text x="280" y="160" text-anchor="middle" font-size="18" fill="#0f172a">σ(w₂x+b₂)</text>
<text x="280" y="220" text-anchor="middle" font-size="18" fill="#0f172a">σ(w₃x+b₃)</text>
<text x="280" y="280" text-anchor="middle" font-size="18" fill="#0f172a">σ(w₄x+b₄)</text>
<circle cx="566" cy="182" r="34" fill="#fee2e2" stroke="#dc2626" stroke-width="3"></circle>
<text x="566" y="190" text-anchor="middle" font-size="26" fill="#b91c1c">ŷ</text>
<line x1="140" y1="168" x2="252" y2="104" stroke="#94a3b8" stroke-width="3"></line>
<line x1="140" y1="176" x2="252" y2="144" stroke="#94a3b8" stroke-width="3"></line>
<line x1="140" y1="188" x2="252" y2="204" stroke="#94a3b8" stroke-width="3"></line>
<line x1="140" y1="196" x2="252" y2="264" stroke="#94a3b8" stroke-width="3"></line>
<line x1="308" y1="92" x2="532" y2="168" stroke="#f59e0b" stroke-width="3"></line>
<line x1="308" y1="152" x2="532" y2="176" stroke="#f59e0b" stroke-width="3"></line>
<line x1="308" y1="212" x2="532" y2="188" stroke="#f59e0b" stroke-width="3"></line>
<line x1="308" y1="272" x2="532" y2="196" stroke="#f59e0b" stroke-width="3"></line>
<text x="176" y="70" font-size="18" fill="#475569">输入</text>
<text x="242" y="54" font-size="18" fill="#475569">隐藏层：并列特征</text>
<text x="520" y="70" font-size="18" fill="#475569">输出层：线性组合</text>
<text x="420" y="326" text-anchor="middle" font-size="22" fill="#0f172a">f(x)=∑ a_j σ(w_j x+b_j)+c</text>
</svg>
<figcaption>单隐层网络可以看成“先并列生成一组可学习基函数，再把这些基函数做线性组合”。这也是它和固定基函数模型最接近的地方。</figcaption>
</figure>

## 第四阶段：ReLU 为什么把单层网络和分段线性拟合连了起来

定义 ReLU 函数

$$
\operatorname{ReLU}(z) = z_+ = \max(z, 0)
$$

在一维情形里，$(x-t)_+$ 在点 $t$ 左边等于 $0$，右边等于一条斜率为 $1$ 的直线，所以它正好是一种“从拐点开始生效的修正项”。

这就带来下面这个核心命题。

**命题**  
设 $f$ 是一维连续分段线性函数，拐点为

$$
t_1 < t_2 < \cdots < t_k
$$

则存在常数 $a, b, c_1, \dots, c_k$，使得

$$
f(x) = a + bx + \sum_{i=1}^{k} c_i (x-t_i)_+
$$

其中 $(x-t_i)_+ = \max(x-t_i, 0)$。

**证明**  
记 $f$ 在区间

$$
(-\infty, t_1),\ (t_1, t_2),\ \dots,\ (t_k, \infty)
$$

上的斜率分别为

$$
m_0, m_1, \dots, m_k
$$

并定义每个拐点处的斜率增量

$$
c_i = m_i - m_{i-1}, \qquad i=1,\dots,k
$$

再令

$$
b = m_0
$$

其中 $b$ 表示最左边那一段的初始斜率。取某个 $x_0 < t_1$，定义

$$
a = f(x_0) - b x_0
$$

现在构造函数

$$
g(x) = a + bx + \sum_{i=1}^{k} c_i (x-t_i)_+
$$

对于任意区间 $(t_j, t_{j+1})$，当 $i \le j$ 时有 $(x-t_i)_+ = x-t_i$，当 $i > j$ 时有 $(x-t_i)_+ = 0$，因此

$$
g(x)
=
a + bx + \sum_{i=1}^{j} c_i (x-t_i)
$$

整理得

$$
g(x)
=
\left(a - \sum_{i=1}^{j} c_i t_i\right)
+
\left(b + \sum_{i=1}^{j} c_i\right)x
$$

所以在该区间上的斜率为

$$
b + \sum_{i=1}^{j} c_i
=
m_0 + \sum_{i=1}^{j} (m_i - m_{i-1})
=
m_j
$$

这说明 $g$ 在每个分段上的斜率都与 $f$ 相同；而在最左边区间 $(-\infty, t_1)$ 上，所有修正项都为零，于是

$$
g(x) = a + bx = f(x)
$$

由于 $f$ 和 $g$ 在最左边一段一致，并且之后每经过一个拐点，二者的斜率变化也完全相同，所以两者在每一段上都重合，从而

$$
f(x) = g(x)
$$

命题得证。

这个命题的含义，图里比文字更直接：先有一条基准直线，再在若干拐点之后逐段修正斜率。

<figure class="math-figure">
<svg viewBox="0 0 720 620" role="img" aria-label="多个ReLU修正项逐层相加形成最终分段线性函数的示意图">
<defs><linearGradient id="relu-correction-bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#fff7ed"></stop><stop offset="100%" stop-color="#eff6ff"></stop></linearGradient></defs>
<rect x="0" y="0" width="720" height="620" fill="url(#relu-correction-bg)"></rect>
<text x="360" y="38" text-anchor="middle" font-size="28" fill="#0f172a">同一个 x 上，函数值是逐层相加出来的</text>
<line x1="250" y1="76" x2="250" y2="560" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 7"></line>
<line x1="410" y1="76" x2="410" y2="560" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 7"></line>
<line x1="560" y1="76" x2="560" y2="560" stroke="#94a3b8" stroke-width="2" stroke-dasharray="7 7"></line>
<text x="250" y="66" text-anchor="middle" font-size="18" fill="#475569">x = x1</text>
<text x="410" y="66" text-anchor="middle" font-size="18" fill="#475569">x = x2</text>
<text x="560" y="66" text-anchor="middle" font-size="18" fill="#475569">x = x3</text>
<text x="78" y="110" font-size="21" fill="#334155">a + bx</text>
<line x1="110" y1="170" x2="640" y2="170" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="118" y1="92" x2="118" y2="182" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="140" y1="158" x2="620" y2="122" stroke="#94a3b8" stroke-width="7" stroke-linecap="round"></line>
<circle cx="250" cy="150" r="7" fill="#64748b"></circle>
<circle cx="410" cy="138" r="7" fill="#64748b"></circle>
<circle cx="560" cy="127" r="7" fill="#64748b"></circle>
<text x="356" y="216" text-anchor="middle" font-size="30" fill="#94a3b8">+</text>
<text x="78" y="260" font-size="21" fill="#334155">c1(x-t1)+</text>
<line x1="110" y1="320" x2="640" y2="320" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="118" y1="242" x2="118" y2="332" stroke="#cbd5e1" stroke-width="2"></line>
<path d="M 140 320 L 320 320 L 620 250" fill="none" stroke="#22c55e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></path>
<line x1="320" y1="252" x2="320" y2="320" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="8 8"></line>
<text x="332" y="266" font-size="18" fill="#16a34a">t1 之后才开始增长</text>
<circle cx="250" cy="320" r="7" fill="#16a34a"></circle>
<circle cx="410" cy="299" r="7" fill="#16a34a"></circle>
<circle cx="560" cy="264" r="7" fill="#16a34a"></circle>
<text x="218" y="308" font-size="16" fill="#64748b">= 0</text>
<text x="356" y="366" text-anchor="middle" font-size="30" fill="#94a3b8">+</text>
<text x="78" y="410" font-size="21" fill="#334155">c2(x-t2)+</text>
<line x1="110" y1="470" x2="640" y2="470" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="118" y1="392" x2="118" y2="482" stroke="#cbd5e1" stroke-width="2"></line>
<path d="M 140 470 L 470 470 L 620 430" fill="none" stroke="#f97316" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></path>
<line x1="470" y1="402" x2="470" y2="470" stroke="#f97316" stroke-width="2.5" stroke-dasharray="8 8"></line>
<text x="482" y="416" font-size="18" fill="#ea580c">t2 之后才开始增长</text>
<circle cx="250" cy="470" r="7" fill="#ea580c"></circle>
<circle cx="410" cy="470" r="7" fill="#ea580c"></circle>
<circle cx="560" cy="446" r="7" fill="#ea580c"></circle>
<text x="212" y="458" font-size="16" fill="#64748b">= 0</text>
<text x="372" y="458" font-size="16" fill="#64748b">= 0</text>
<text x="356" y="516" text-anchor="middle" font-size="30" fill="#94a3b8">=</text>
<text x="78" y="562" font-size="21" fill="#334155">最终和函数</text>
<line x1="110" y1="602" x2="640" y2="602" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="118" y1="524" x2="118" y2="614" stroke="#cbd5e1" stroke-width="2"></line>
<line x1="140" y1="588" x2="620" y2="552" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 10"></line>
<path d="M 140 588 L 320 574 L 470 532 L 620 482" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
<circle cx="250" cy="580" r="7" fill="#0f172a"></circle>
<circle cx="410" cy="549" r="7" fill="#0f172a"></circle>
<circle cx="560" cy="502" r="7" fill="#0f172a"></circle>
<text x="428" y="535" font-size="18" fill="#64748b">虚线是未修正前的 a + bx</text>
<text x="230" y="610" font-size="16" fill="#475569">x1: 只有基准直线</text>
<text x="360" y="610" font-size="16" fill="#475569">x2: 基准 + 第一个 ReLU</text>
<text x="490" y="610" font-size="16" fill="#475569">x3: 三项都参与</text>
</svg>
<figcaption>关键不是“多个 ReLU 互相比较”，而是对同一个输入 $x$，每个修正项各自给出一个数值贡献；这些贡献与基准直线逐点相加，最终形成分段线性函数。</figcaption>
</figure>

而单隐层 ReLU 网络在一维输入下正是

$$
f(x) = c + \sum_{j=1}^{m} a_j \operatorname{ReLU}(w_j x + b_j)
$$

经过重参数化后，它与上面的修正表示是同一类对象。  
因此，从拟合角度看，单层 ReLU 网络就是一种自动选择拐点位置和修正幅度的分段线性拟合器。

既然 ReLU 叠加出来的是折线，为什么它还能拟合光滑曲线？答案也很简单：光滑曲线本来就可以被足够细的折线逼近。

<figure class="math-figure">
<svg viewBox="0 0 720 420" role="img" aria-label="更多ReLU分段使折线更贴近平滑非线性曲线的示意图">
<defs><linearGradient id="relu-approx-bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f8fafc"></stop><stop offset="100%" stop-color="#eef2ff"></stop></linearGradient></defs>
<rect x="0" y="0" width="720" height="420" fill="url(#relu-approx-bg)"></rect>
<text x="360" y="38" text-anchor="middle" font-size="28" fill="#0f172a">ReLU 本身给折线，但折线可以逼近平滑曲线</text>
<line x1="84" y1="326" x2="650" y2="326" stroke="#94a3b8" stroke-width="2"></line>
<line x1="96" y1="72" x2="96" y2="340" stroke="#94a3b8" stroke-width="2"></line>
<path d="M 120 278 C 180 238, 220 178, 280 138 C 336 102, 388 98, 436 126 C 498 162, 548 226, 620 288" fill="none" stroke="#0f766e" stroke-width="8" stroke-linecap="round"></path>
<path d="M 120 286 L 214 214 L 320 126 L 442 144 L 620 274" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M 120 280 L 170 246 L 220 198 L 270 152 L 320 124 L 370 112 L 420 122 L 470 150 L 520 194 L 570 244 L 620 286" fill="none" stroke="#1d4ed8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path>
<circle cx="214" cy="214" r="6" fill="#f97316"></circle>
<circle cx="320" cy="126" r="6" fill="#f97316"></circle>
<circle cx="442" cy="144" r="6" fill="#f97316"></circle>
<circle cx="170" cy="246" r="5" fill="#1d4ed8"></circle>
<circle cx="270" cy="152" r="5" fill="#1d4ed8"></circle>
<circle cx="370" cy="112" r="5" fill="#1d4ed8"></circle>
<circle cx="470" cy="150" r="5" fill="#1d4ed8"></circle>
<circle cx="570" cy="244" r="5" fill="#1d4ed8"></circle>
<text x="506" y="102" font-size="22" fill="#0f766e">真实非线性曲线</text>
<text x="468" y="164" font-size="20" fill="#f97316">少量 ReLU：粗折线</text>
<text x="440" y="214" font-size="20" fill="#1d4ed8">更多 ReLU：更细的折线</text>
<text x="170" y="352" font-size="18" fill="#64748b">拐点越多，逼近越细</text>
<text x="458" y="352" font-size="18" fill="#64748b">本质仍然是分段线性</text>
</svg>
<figcaption>单隐层 ReLU 网络输出的是分段线性函数，但只要允许足够多的拐点，这些折线就可以逐步逼近平滑的非线性目标。</figcaption>
</figure>

## 第五阶段：既然单层已经很强，为什么还需要多层

到这里，一个自然问题出现了：如果单层已经很强，为什么还要继续加深？  
答案是：**单层网络解决了可表示性，多层网络进一步解决了高效表示性。**

单层网络的结构是

$$
f(x) = \sum_{j=1}^{m} a_j \sigma(w_j^\top x + b_j) + c
$$

它本质上是把许多简单非线性单元并列摆放，再做一次加权求和。结构已经很强，但组合方式仍然是扁平的。

多层网络则不同。它的前一层输出会变成后一层的输入，例如两层网络可以写成

$$
f(x) = A_2 \,\sigma\bigl(A_1 \,\sigma(Wx + b_1) + b_2\bigr) + c
$$

此时第二层不再直接作用于原始输入，而是作用于第一层构造出的中间特征。也就是说，模型开始**组合已经学到的特征**。

<figure class="math-figure">
<svg viewBox="0 0 720 390" role="img" aria-label="深度学习通过多层隐藏表示逐层组合特征的示意图">
<defs><linearGradient id="deep-net-bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#fff7ed"></stop><stop offset="100%" stop-color="#eef2ff"></stop></linearGradient></defs>
<rect x="0" y="0" width="720" height="390" fill="url(#deep-net-bg)"></rect>
<text x="360" y="38" text-anchor="middle" font-size="28" fill="#0f172a">深度学习：前一层的表示，继续交给后一层组合</text>
<circle cx="98" cy="196" r="28" fill="#dbeafe" stroke="#2563eb" stroke-width="3"></circle>
<text x="98" y="204" text-anchor="middle" font-size="22" fill="#1d4ed8">x</text>
<circle cx="230" cy="108" r="22" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="230" cy="164" r="22" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="230" cy="220" r="22" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="230" cy="276" r="22" fill="#ecfeff" stroke="#0891b2" stroke-width="3"></circle>
<circle cx="392" cy="132" r="22" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"></circle>
<circle cx="392" cy="196" r="22" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"></circle>
<circle cx="392" cy="260" r="22" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"></circle>
<circle cx="548" cy="196" r="30" fill="#fee2e2" stroke="#dc2626" stroke-width="3"></circle>
<text x="548" y="204" text-anchor="middle" font-size="24" fill="#b91c1c">ŷ</text>
<line x1="124" y1="184" x2="208" y2="118" stroke="#94a3b8" stroke-width="3"></line>
<line x1="124" y1="190" x2="208" y2="162" stroke="#94a3b8" stroke-width="3"></line>
<line x1="124" y1="202" x2="208" y2="222" stroke="#94a3b8" stroke-width="3"></line>
<line x1="124" y1="208" x2="208" y2="272" stroke="#94a3b8" stroke-width="3"></line>
<line x1="252" y1="112" x2="370" y2="136" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="252" y1="164" x2="370" y2="136" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="252" y1="164" x2="370" y2="196" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="252" y1="220" x2="370" y2="196" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="252" y1="220" x2="370" y2="260" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="252" y1="276" x2="370" y2="260" stroke="#8b5cf6" stroke-width="3"></line>
<line x1="414" y1="136" x2="518" y2="182" stroke="#f59e0b" stroke-width="3"></line>
<line x1="414" y1="196" x2="518" y2="196" stroke="#f59e0b" stroke-width="3"></line>
<line x1="414" y1="260" x2="518" y2="210" stroke="#f59e0b" stroke-width="3"></line>
<text x="180" y="72" font-size="18" fill="#475569">第一层：局部特征</text>
<text x="350" y="88" font-size="18" fill="#475569">第二层：组合后的特征</text>
<text x="500" y="92" font-size="18" fill="#475569">输出</text>
<text x="360" y="344" text-anchor="middle" font-size="22" fill="#0f172a">f(x)=f_L ∘ f_{L-1} ∘ ⋯ ∘ f_1(x)</text>
</svg>
<figcaption>深层网络和单层网络的区别，不只是“节点更多”，而是中间表示可以继续被后续层加工和重组，这就是分层表达的核心。</figcaption>
</figure>

图里已经说明了差别：单层网络是“并列生成后一次组合”，深层网络是“表示还能继续被后续层加工”。  
因此，深度学习不是对单层网络的否定，而是把“表示的组合”这件事继续推进了一层又一层。

## 演化主线回看：模型变复杂了，但问题始终没变

现在回头看，这条路线就是三次参数化增强。

第一次，是从一次函数到一般线性模型：

$$
f(x) = w^\top x + b
$$

输入从标量扩展到了向量，但本质没变。

第二次，是从原始输入上的线性模型，到固定基函数上的线性组合：

$$
f(x) = \sum_{j=1}^{m} \beta_j \phi_j(x)
$$

复杂函数不一定要直接拟合，可以先选一组函数基，再学它们的系数。

第三次，是从固定基函数到可学习基函数，再到可组合的分层表示：

$$
f(x) = \sum_{j=1}^{m} a_j \sigma(w_j^\top x + b_j) + c
$$

以及更一般的多层复合

$$
f(x) = f_L \circ f_{L-1} \circ \cdots \circ f_1 (x)
$$

此时模型不只学习系数，还学习特征如何构造、如何继续组合。

所以从线性拟合到深度学习，真正不断变化的不是目标函数，而是函数族的参数化方式：

- 线性拟合：直接拟合一个简单函数空间
- 基函数模型：在预先选定的函数基上拟合
- 单层神经网络：学习基函数本身
- 深度学习：学习可层层组合的表示

把这条主线抓住，神经网络就不会显得神秘：它只是一个不断增强函数表达能力的参数化框架。

## 小结

从拟合视角看，线性回归、单层神经网络和深度学习不是割裂的三种思想，而是同一个问题上的连续升级：当当前函数族不够表达数据关系时，我们就换一个更强的参数化方式。本文真正保留的骨架只有四件事：监督学习三要素、线性模型、ReLU 修正表示，以及分层复合。
