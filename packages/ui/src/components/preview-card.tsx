'use client';

import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card';
import * as React from 'react';

import { cn } from '@bounty/ui/lib/utils';

const PreviewCard = PreviewCardPrimitive.Root;

function PreviewCardTrigger({
  asChild,
  children,
  ...props
}: PreviewCardPrimitive.Trigger.Props & { asChild?: boolean }) {
  let finalRender = props.render;
  let finalChildren = children;
  if (asChild && !props.render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    finalRender = React.cloneElement(childElement, { children: undefined });
    finalChildren = childElement.props.children;
  }
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="preview-card-trigger"
      {...props}
      render={finalRender}
    >
      {finalChildren}
    </PreviewCardPrimitive.Trigger>
  );
}

function PreviewCardPopup({
  className,
  children,
  align = 'center',
  sideOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props & {
  align?: PreviewCardPrimitive.Positioner.Props['align'];
  sideOffset?: PreviewCardPrimitive.Positioner.Props['sideOffset'];
}) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        align={align}
        className="z-50"
        data-slot="preview-card-positioner"
        sideOffset={sideOffset}
      >
        <PreviewCardPrimitive.Popup
          className={cn(
            'relative flex w-64 origin-(--transform-origin) text-balance rounded-lg border bg-popover not-dark:bg-clip-padding p-4 text-popover-foreground text-sm shadow-lg/5 transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
            className
          )}
          data-slot="preview-card-content"
          {...props}
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export {
  PreviewCard,
  PreviewCard as HoverCard,
  PreviewCardTrigger,
  PreviewCardTrigger as HoverCardTrigger,
  PreviewCardPopup,
  PreviewCardPopup as HoverCardContent,
};
