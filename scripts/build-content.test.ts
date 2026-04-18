import test from 'node:test';
import assert from 'node:assert/strict';

import { markdownToHtmlWithToc } from './content-pipeline';

test('renders math, headings, and code blocks without parsing formulas inside code fences', async () => {
  const markdown = `
## 梯度下降

行内公式 $\\nabla_\\theta J(\\theta)$ 和块级公式：

$$
\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta J(\\theta_t)
$$

\`\`\`python
loss = "$not_math$"
\`\`\`
`;

  const { html, toc } = await markdownToHtmlWithToc(markdown);

  assert.equal(toc.length, 1);
  assert.deepEqual(toc[0], { depth: 2, text: '梯度下降', id: '梯度下降' });
  assert.match(html, /katex/);
  assert.match(html, /<h2 id="梯度下降">梯度下降<\/h2>/);
  assert.match(html, /class="hljs language-python"/);
  assert.match(html, /\$not_math\$/);
});

test('keeps long display math wrapped in a display container and deduplicates heading ids', async () => {
  const markdown = `
## 正态分布

$$
p(x \\mid \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)
$$

## 正态分布
`;

  const { html, toc } = await markdownToHtmlWithToc(markdown);

  assert.deepEqual(
    toc.map((item) => item.id),
    ['正态分布', '正态分布-1']
  );
  assert.match(html, /katex-display/);
  assert.match(html, /id="正态分布-1"/);
});

test('converts demo shortcodes into interactive demo placeholders with serialized props', async () => {
  const markdown = `
## 优化过程

{{< demo name="gradient-descent" title="梯度下降演示" note="观察学习率变化" autoplay="true" >}}
`;

  const { html, toc } = await markdownToHtmlWithToc(markdown);

  assert.deepEqual(toc, [{ depth: 2, text: '优化过程', id: '优化过程' }]);
  assert.match(html, /data-demo="gradient-descent"/);
  assert.match(html, /class="demo-embed"/);
  assert.match(html, /data-demo-props="[^"]*梯度下降演示[^"]*"/);
  assert.match(html, /data-demo-props="[^"]*autoplay[^"]*true[^"]*"/);
});

test('preserves math rendering alongside demo shortcodes in the same article', async () => {
  const markdown = `
## Loss 收敛

$$
\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta J(\\theta_t)
$$

{{< demo name="gradient-descent" title="Loss 收敛演示" >}}
`;

  const { html } = await markdownToHtmlWithToc(markdown);

  assert.match(html, /katex-display/);
  assert.match(html, /data-demo="gradient-descent"/);
});
