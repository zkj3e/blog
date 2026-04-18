import type { ComponentType } from 'react';

export interface DemoProps {
  title: string;
  description: string;
  autoplay: boolean;
  interactive: boolean;
}

export interface DemoDefinition {
  defaultTitle: string;
  defaultDescription: string;
  Component: ComponentType<DemoProps>;
}
