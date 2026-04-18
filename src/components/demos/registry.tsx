import { createRoot, type Root } from 'react-dom/client';
import GradientDescentDemo from './GradientDescentDemo';
import type { DemoDefinition, DemoProps } from './types';

const demoRegistry: Record<string, DemoDefinition> = {
  'gradient-descent': {
    defaultTitle: '梯度下降过程演示',
    defaultDescription: '通过调节学习率观察参数点如何沿着损失曲线向最小值移动。',
    Component: GradientDescentDemo,
  },
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseDemoProps(raw: string | null, definition: DemoDefinition): DemoProps {
  let parsed: Record<string, unknown> = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  return {
    title:
      typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title
        : definition.defaultTitle,
    description:
      typeof parsed.description === 'string' && parsed.description.trim()
        ? parsed.description
        : typeof parsed.note === 'string' && parsed.note.trim()
          ? parsed.note
          : definition.defaultDescription,
    autoplay: parseBoolean(parsed.autoplay, false),
    interactive: parseBoolean(parsed.interactive, true),
  };
}

export function mountInteractiveDemos(container: HTMLElement): Array<() => void> {
  const cleanups: Array<() => void> = [];
  const nodes = Array.from(container.querySelectorAll<HTMLElement>('.demo-embed[data-demo]'));

  for (const node of nodes) {
    const demoName = node.dataset.demo;
    if (!demoName) continue;

    const definition = demoRegistry[demoName];
    if (!definition) {
      node.innerHTML = `<div class="demo-shell demo-shell--missing"><p>Unknown demo: ${demoName}</p></div>`;
      continue;
    }

    const root: Root = createRoot(node);
    root.render(<definition.Component {...parseDemoProps(node.dataset.demoProps ?? null, definition)} />);
    cleanups.push(() => root.unmount());
  }

  return cleanups;
}
