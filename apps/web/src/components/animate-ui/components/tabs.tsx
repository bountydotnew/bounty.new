'use client';

import { cn } from '@bounty/ui/lib/utils';
import { type HTMLMotionProps, motion, type Transition } from 'motion/react';
import * as React from 'react';
import {
  MotionHighlight,
  MotionHighlightItem,
} from '@/components/animate-ui/effects/motion-highlight';

type TabsContextType<T extends string> = {
  activeValue: T;
  handleValueChange: (value: T) => void;
  registerTrigger: (value: T, node: HTMLElement | null) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabsContext = React.createContext<TabsContextType<any> | undefined>(
  undefined
);

function useTabs<T extends string = string>(): TabsContextType<T> {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}

type BaseTabsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
};

type UnControlledTabsProps<T extends string = string> = BaseTabsProps & {
  defaultValue?: T;
  value?: never;
  onValueChange?: never;
};

type ControlledTabsProps<T extends string = string> = BaseTabsProps & {
  value: T;
  onValueChange?: (value: T) => void;
  defaultValue?: never;
};

type TabsProps<T extends string = string> =
  | UnControlledTabsProps<T>
  | ControlledTabsProps<T>;

function Tabs<T extends string = string>({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps<T>) {
  const [activeValue, setActiveValue] = React.useState<T | undefined>(
    defaultValue ?? undefined
  );
  const triggersRef = React.useRef(new Map<string, HTMLElement>());
  const initialSet = React.useRef(false);
  const isControlled = value !== undefined;

  React.useEffect(() => {
    if (
      !isControlled &&
      activeValue === undefined &&
      triggersRef.current.size > 0 &&
      !initialSet.current
    ) {
      const firstTab = Array.from(triggersRef.current.keys())[0];
      setActiveValue(firstTab as T);
      initialSet.current = true;
    }
  }, [activeValue, isControlled]);

  const registerTrigger = (value: string, node: HTMLElement | null) => {
    if (node) {
      triggersRef.current.set(value, node);
      if (!isControlled && activeValue === undefined && !initialSet.current) {
        setActiveValue(value as T);
        initialSet.current = true;
      }
    } else {
      triggersRef.current.delete(value);
    }
  };

  const handleValueChange = (val: T) => {
    if (isControlled) {
      onValueChange?.(val);
    } else {
      setActiveValue(val);
    }
  };

  return (
    <TabsContext.Provider
      value={{
        activeValue: (value ?? activeValue)! as T,
        handleValueChange,
        registerTrigger,
      }}
    >
      <div
        className={cn('flex flex-col gap-2', className)}
        data-slot="tabs"
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabsListProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
  activeClassName?: string;
  transition?: Transition;
};

function TabsList({
  children,
  className,
  activeClassName,
  transition = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
  ...props
}: TabsListProps) {
  const { activeValue } = useTabs();

  return (
    <MotionHighlight
      className={cn('rounded-sm bg-background shadow-sm', activeClassName)}
      controlledItems
      transition={transition}
      value={activeValue}
    >
      <div
        className={cn(
          'inline-flex h-10 w-fit items-center justify-center rounded-lg bg-muted p-[4px] text-muted-foreground',
          className
        )}
        data-slot="tabs-list"
        role="tablist"
        {...props}
      >
        {children}
      </div>
    </MotionHighlight>
  );
}

type TabsTriggerProps = HTMLMotionProps<'button'> & {
  value: string;
  children: React.ReactNode;
};

function TabsTrigger({
  ref,
  value,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const { activeValue, handleValueChange, registerTrigger } = useTabs();

  const localRef = React.useRef<HTMLButtonElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

  React.useEffect(() => {
    registerTrigger(value, localRef.current);
    return () => registerTrigger(value, null);
  }, [value, registerTrigger]);

  return (
    <MotionHighlightItem className="size-full" value={value}>
      <motion.button
        className={cn(
          'z-[1] inline-flex size-full cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 font-medium text-sm ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground',
          className
        )}
        data-slot="tabs-trigger"
        data-state={activeValue === value ? 'active' : 'inactive'}
        onClick={() => handleValueChange(value)}
        ref={localRef}
        role="tab"
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
      </motion.button>
    </MotionHighlightItem>
  );
}

type TabsContentsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
  transition?: Transition;
};

function TabsContents({
  children,
  className,
  transition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs();
  const childrenArray = React.Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    (child): child is React.ReactElement<{ value: string }> =>
      React.isValidElement(child) &&
      typeof child.props === 'object' &&
      child.props !== null &&
      'value' in child.props &&
      child.props.value === activeValue
  );

  return (
    <div
      className={cn('overflow-hidden', className)}
      data-slot="tabs-contents"
      {...props}
    >
      <motion.div
        animate={{ x: `${activeIndex * -100}%` }}
        className="-mx-2 flex"
        transition={transition}
      >
        {childrenArray.map((child, index) => (
          <div className="w-full shrink-0 px-2" key={index}>
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

type TabsContentProps = HTMLMotionProps<'div'> & {
  value: string;
  children: React.ReactNode;
};

function TabsContent({
  children,
  // value,
  className,
  ...props
}: TabsContentProps) {
  //const { activeValue } = useTabs();
  // const isActive = activeValue === value;
  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      data-slot="tabs-content"
      exit={{ filter: 'blur(0px)' }}
      initial={{ filter: 'blur(0px)' }}
      role="tabpanel"
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  useTabs,
  type TabsContextType,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentsProps,
  type TabsContentProps,
};
