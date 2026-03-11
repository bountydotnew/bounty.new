'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import * as React from 'react';

import { cn } from '@bounty/ui/lib/utils';

function Collapsible({
  asChild,
  children,
  ...props
}: CollapsiblePrimitive.Root.Props & { asChild?: boolean }) {
  // Note: Collapsible.Root's asChild is different - it typically means rendering as a different element
  // For backwards compatibility, we just pass through and ignore asChild on Root
  return (
    <CollapsiblePrimitive.Root data-slot="collapsible" {...props}>
      {children}
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  className,
  asChild,
  children,
  ...props
}: CollapsiblePrimitive.Trigger.Props & { asChild?: boolean }) {
  let finalRender = props.render;
  let finalChildren = children;

  if (asChild && !props.render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    const { children: childChildren, ...childProps } = childElement.props;
    finalRender = React.cloneElement(childElement, childProps);
    finalChildren = childChildren;
  }

  return (
    <CollapsiblePrimitive.Trigger
      className={cn('cursor-pointer', className)}
      data-slot="collapsible-trigger"
      {...props}
      render={finalRender}
    >
      {finalChildren}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsiblePanel({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      className={cn(
        'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0',
        className
      )}
      data-slot="collapsible-panel"
      {...props}
    />
  );
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsiblePanel,
  CollapsiblePanel as CollapsibleContent,
};
