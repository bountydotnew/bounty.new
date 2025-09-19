import { cn } from '@bounty/ui/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import type * as React from 'react';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn('flex flex-col gap-2', className)}
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'relative inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground',
        className
      )}
      data-slot="tabs-list"
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 font-medium text-foreground text-sm transition-[color,box-shadow] focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-transparent data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:text-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="tabs-trigger"
      {...props}
    >
      {/* Animated thumb lives inside the active trigger; Framer animates between old/new DOM positions */}
      <span className="relative z-[1] flex items-center gap-1.5">
        {children}
      </span>
      {/* render after content so it sits behind text */}
      <span className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          className="absolute inset-[3px] rounded-md border border-border/60 bg-background shadow-sm"
          layoutId="tabs-thumb"
          style={{ display: 'none' }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      </span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('flex-1 outline-none', className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
