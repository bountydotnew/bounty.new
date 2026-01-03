import type * as React from 'react';
import type * as RechartsPrimitive from 'recharts';

export interface ChartConfigItem {
  label?: React.ReactNode;
  icon?: React.ComponentType;
}

export interface ChartConfigWithColor extends ChartConfigItem {
  color?: string;
  theme?: never;
}

export interface ChartConfigWithTheme extends ChartConfigItem {
  color?: never;
  theme: Record<string, string>;
}

export type ChartConfigValue = ChartConfigWithColor | ChartConfigWithTheme;

export interface ChartConfig {
  [k: string]: ChartConfigValue;
}

export interface ChartContextProps {
  config: ChartConfig;
}

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
}

export interface ChartStyleProps {
  id: string;
  config: ChartConfig;
}
