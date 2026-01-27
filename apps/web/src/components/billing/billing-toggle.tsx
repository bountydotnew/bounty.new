'use client';

import { cn } from '@bounty/ui';

interface BillingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <fieldset aria-label="Payment frequency" className="flex justify-center">
      <div className="relative flex rounded-full bg-[#1a1a1a] p-0.5 ring-1 ring-inset ring-[#2a2a2a]">
        {/* Sliding background indicator */}
        <div
          className={cn(
            'absolute rounded-full bg-[#252525] border border-[#3a3a3a] transition-all duration-200',
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
            className="absolute inset-0 cursor-pointer appearance-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efefef]"
          />
          <span
            className={cn(
              'relative z-10 transition-colors',
              value === 'monthly' ? 'text-[#efefef]' : 'text-[#888] hover:text-[#efefef]'
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
            className="absolute inset-0 cursor-pointer appearance-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efefef]"
          />
          <span
            className={cn(
              'relative z-10 transition-colors',
              value === 'yearly' ? 'text-[#efefef]' : 'text-[#888] hover:text-[#efefef]'
            )}
          >
            Yearly
          </span>
        </label>
      </div>
    </fieldset>
  );
}
