'use client';

import * as React from 'react';
import { Fieldset as FieldsetPrimitive } from '@base-ui/react/fieldset';

import { cn } from '@bounty/ui/lib/utils';

const Fieldset = React.forwardRef<
  HTMLFieldSetElement,
  FieldsetPrimitive.Root.Props
>(({ className, ...props }, ref) => {
  return (
    <FieldsetPrimitive.Root
      ref={ref}
      className={cn('flex w-full max-w-64 flex-col gap-6', className)}
      data-slot="fieldset"
      {...props}
    />
  );
});
Fieldset.displayName = 'Fieldset';

const FieldsetLegend = React.forwardRef<
  HTMLLegendElement,
  FieldsetPrimitive.Legend.Props
>(({ className, ...props }, ref) => {
  return (
    <FieldsetPrimitive.Legend
      ref={ref}
      className={cn('font-semibold text-foreground', className)}
      data-slot="fieldset-legend"
      {...props}
    />
  );
});
FieldsetLegend.displayName = 'FieldsetLegend';

export { Fieldset, FieldsetLegend };
