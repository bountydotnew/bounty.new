'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';

import { cn } from '@bounty/ui/lib/utils';

// Helper to convert asChild to render prop pattern
function useAsChild<T extends React.ElementType>(
  render: useRender.ComponentProps<T>['render'],
  asChild: boolean | undefined,
  children: React.ReactNode
): {
  finalRender: useRender.ComponentProps<T>['render'];
  finalChildren: React.ReactNode;
} {
  let finalRender = render;
  let finalChildren = children;

  if (asChild && !render && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childElement = children as React.ReactElement<any>;
    finalRender = React.cloneElement(childElement, { children: undefined });
    finalChildren = childElement.props.children;
  }

  return { finalRender, finalChildren };
}

function Card({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'relative flex flex-col rounded-2xl border bg-card not-dark:bg-clip-padding text-card-foreground shadow-xs/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
      className
    ),
    'data-slot': 'card',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFrame({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'flex flex-col relative rounded-2xl border bg-background before:absolute before:inset-0 before:rounded-[inherit] before:bg-muted/72 before:pointer-events-none not-dark:bg-clip-padding text-card-foreground shadow-xs/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)] *:data-[slot=card]:-m-px *:not-last:data-[slot=card]:rounded-b-lg *:not-last:data-[slot=card]:before:rounded-b-[calc(var(--radius-lg)-1px)] *:not-first:data-[slot=card]:rounded-t-lg *:not-first:data-[slot=card]:before:rounded-t-[calc(var(--radius-lg)-1px)] *:data-[slot=card]:[clip-path:inset(-1rem_1px)] *:data-[slot=card]:first:[clip-path:inset(1px_1px_-1rem_1px_round_calc(var(--radius-2xl)-1px))] *:data-[slot=card]:last:[clip-path:inset(-1rem_1px_1px_1px_round_calc(var(--radius-2xl)-1px))] *:data-[slot=card]:shadow-none *:data-[slot=card]:before:hidden *:data-[slot=card]:bg-clip-padding',
      className
    ),
    'data-slot': 'card-frame',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFrameHeader({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('flex flex-col px-6 py-4', className),
    'data-slot': 'card-frame-header',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFrameTitle({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('font-semibold text-sm', className),
    'data-slot': 'card-frame-title',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFrameDescription({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('text-muted-foreground text-sm', className),
    'data-slot': 'card-frame-description',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFrameFooter({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('px-6 py-4', className),
    'data-slot': 'card-frame-footer',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardHeader({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
      className
    ),
    'data-slot': 'card-header',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardTitle({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('font-semibold text-lg leading-none', className),
    'data-slot': 'card-title',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardDescription({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn('text-muted-foreground text-sm', className),
    'data-slot': 'card-description',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardAction({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'col-start-2 row-span-2 row-start-1 self-start justify-self-end inline-flex',
      className
    ),
    'data-slot': 'card-action',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardPanel({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'flex-1 p-6 in-[[data-slot=card]:has(>[data-slot=card-header]:not(.border-b))]:pt-0 in-[[data-slot=card]:has(>[data-slot=card-footer]:not(.border-t))]:pb-0',
      className
    ),
    'data-slot': 'card-panel',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

function CardFooter({
  className,
  render,
  asChild,
  children,
  ...props
}: useRender.ComponentProps<'div'> & { asChild?: boolean }) {
  const { finalRender, finalChildren } = useAsChild(render, asChild, children);
  const defaultProps = {
    className: cn(
      'flex items-center p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pt-4',
      className
    ),
    'data-slot': 'card-footer',
    children: finalChildren,
  };

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render: finalRender,
  });
}

export {
  Card,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardFrameDescription,
  CardFrameFooter,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardPanel as CardContent,
  CardTitle,
};
