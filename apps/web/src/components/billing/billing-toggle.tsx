'use client';

import { cn } from '@bounty/ui';

interface BillingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <fieldset aria-label="Payment frequency" className="flex justify-center">
      <div className="relative flex rounded-full bg-surface-1 p-0.5 ring-1 ring-inset ring-border-default">
        {/* Sliding background indicator */}
        <div
          className={cn(
            'absolute rounded-full bg-surface-2 border border-border-strong transition-all duration-200',
            'top-0.5 bottom-0.5',
            value === 'monthly' ? 'left-0.5 w-[88px]' : 'left-[92px] w-[72px]'
          )}
        />

        {/* Monthly option */}
        <label className="relative cursor-pointer rounded-full px-4 py-1.5 text-sm leading-tight">
          <input
            type="radio"
            name="frequency"
            value="monthly"
            checked={value === 'monthly'}
            onChange={() => onChange('monthly')}
            className="absolute inset-0 cursor-pointer appearance-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          <span
            className={cn(
              'relative z-10 transition-colors',
              value === 'monthly' ? 'text-foreground' : 'text-text-muted hover:text-foreground'
            )}
          >
            Monthly
          </span>
        </label>

        {/* Yearly option */}
        <label className="relative cursor-pointer rounded-full px-4 py-1.5 text-sm leading-tight">
          <input
            type="radio"
            name="frequency"
            value="yearly"
            checked={value === 'yearly'}
            onChange={() => onChange('yearly')}
            className="absolute inset-0 cursor-pointer appearance-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          <span
            className={cn(
              'relative z-10 transition-colors',
              value === 'yearly' ? 'text-foreground' : 'text-text-muted hover:text-foreground'
            )}
          >
            Yearly
          </span>
        </label>
      </div>
    </fieldset>
  );
}
