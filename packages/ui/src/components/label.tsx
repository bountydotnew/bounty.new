'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';

import { cn } from '@bounty/ui/lib/utils';

function Label({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'label'> & { asChild?: boolean }) {
  // asChild support: convert first child element to render prop
  let finalRender = render;
  let finalChildren = children;

  if (asChild && !render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    finalRender = React.cloneElement(childElement, { children: undefined });
    finalChildren = childElement.props.children;
  }

  const defaultProps = {
    className: cn(
      'inline-flex items-center gap-2 text-base/4.5 sm:text-sm/4 font-medium text-foreground',
      className
    ),
    'data-slot': 'label',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'label',
    props: mergeProps<'label'>(defaultProps, props),
    render: finalRender,
  });
}

export { Label };
