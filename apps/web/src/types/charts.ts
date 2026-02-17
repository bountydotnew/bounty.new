import type * as React from 'react';
import type * as RechartsPrimitive from 'recharts';

interface ChartTheme {
  light: string;
  dark: string;
}

interface ChartConfigItem {
  label?: React.ReactNode;
  icon?: React.ComponentType;
}

interface ChartConfigWithColor extends ChartConfigItem {
  color?: string;
  theme?: never;
}

interface ChartConfigWithTheme extends ChartConfigItem {
  color?: never;
  theme: Record<string, string>;
}

type ChartConfigValue = ChartConfigWithColor | ChartConfigWithTheme;

interface ChartConfig {
  [k: string]: ChartConfigValue;
}

interface ChartContextProps {
  config: ChartConfig;
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
}

interface ChartStyleProps {
  id: string;
  config: ChartConfig;
}
