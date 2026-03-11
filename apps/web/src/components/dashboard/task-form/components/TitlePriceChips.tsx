'use client';

import { useState, useRef, useEffect } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@bounty/ui/lib/utils';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';

type ActiveField = 'title' | 'price' | null;

interface TitlePriceChipsProps {
  control: Control<CreateBountyForm>;
}

function formatPrice(value: string): string {
  if (!value) {
    return '';
  }
  const parts = value.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function TitlePriceChips({ control }: TitlePriceChipsProps) {
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const titleChipRef = useRef<HTMLButtonElement>(null);
  const priceChipRef = useRef<HTMLButtonElement>(null);

  // Focus the correct input when activeField changes
  useEffect(() => {
    if (activeField === 'title') {
      // Small delay to let the popover render
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    } else if (activeField === 'price') {
      requestAnimationFrame(() => {
        priceInputRef.current?.focus();
      });
    }
  }, [activeField]);

  // Anchor to whichever chip is active
  const anchorRef = activeField === 'price' ? priceChipRef : titleChipRef;

  return (
    <>
      {/* Title chip button */}
      <button
        ref={titleChipRef}
        type="button"
        onClick={() => setActiveField(activeField === 'title' ? null : 'title')}
        className={cn(
          'rounded-full flex justify-center items-center px-[6px] py-[3px] shrink-0 gap-2 bg-surface-hover border border-solid transition-colors cursor-pointer',
          activeField === 'title'
            ? 'border-border-default'
            : 'border-border-subtle hover:border-border-default'
        )}
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => {
            const displayValue = field.value || 'Title';
            return (
              <span
                className={`text-[16px] leading-5 font-sans ${
                  field.value ? 'text-foreground' : 'text-text-muted'
                }`}
              >
                {displayValue}
              </span>
            );
          }}
        />
        <ChevronSortIcon className="size-2 text-text-muted shrink-0" />
      </button>

      {/* Price chip button */}
      <button
        ref={priceChipRef}
        type="button"
        onClick={() => setActiveField(activeField === 'price' ? null : 'price')}
        className={cn(
          'rounded-full flex justify-center items-center px-[6px] py-[3px] shrink-0 gap-2 bg-surface-hover border border-solid transition-colors cursor-pointer',
          activeField === 'price'
            ? 'border-border-default'
            : 'border-border-subtle hover:border-border-default'
        )}
      >
        <Controller
          control={control}
          name="amount"
          render={({ field }) => {
            const formatted = formatPrice(field.value);
            return (
              <span
                className={`text-[16px] leading-5 font-sans ${
                  field.value ? 'text-foreground' : 'text-text-muted'
                }`}
              >
                {formatted ? `$${formatted}` : 'Price'}
              </span>
            );
          }}
        />
        <ChevronSortIcon className="size-2 text-text-muted shrink-0" />
      </button>

      {/* Single shared popover */}
      <PopoverPrimitive.Root
        open={activeField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveField(null);
          }
        }}
      >
        {/* Hidden trigger — we manage open state ourselves */}
        <PopoverPrimitive.Trigger
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner
            anchor={anchorRef}
            align="start"
            sideOffset={8}
            side="bottom"
            className="z-50 transition-[top,left,right,bottom,transform] data-instant:transition-none"
          >
            <PopoverPrimitive.Popup className="relative flex origin-(--transform-origin) rounded-xl border bg-surface-1 border-border-subtle text-popover-foreground shadow-lg/5 transition-[width,height,scale,opacity] data-starting-style:scale-98 data-starting-style:opacity-0 overflow-hidden">
              <div className="relative w-full overflow-hidden">
                {/* Title input */}
                <div
                  className={cn(
                    'transition-all duration-200 ease-out',
                    activeField === 'title'
                      ? 'opacity-100 translate-x-0 h-auto px-3 py-4'
                      : 'opacity-0 -translate-x-2 h-0 px-3 py-0 pointer-events-none absolute inset-0'
                  )}
                >
                  <Controller
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <input
                        ref={(el) => {
                          titleInputRef.current = el;
                          field.ref(el);
                        }}
                        type="text"
                        value={field.value}
                        onChange={field.onChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' && !e.shiftKey) {
                            e.preventDefault();
                            setActiveField('price');
                          }
                        }}
                        placeholder="Enter a title"
                        className="w-full bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
                        style={{ minWidth: '200px' }}
                      />
                    )}
                  />
                </div>

                {/* Price input */}
                <div
                  className={cn(
                    'transition-all duration-200 ease-out',
                    activeField === 'price'
                      ? 'opacity-100 translate-x-0 h-auto px-3 py-4'
                      : 'opacity-0 translate-x-2 h-0 px-3 py-0 pointer-events-none absolute inset-0'
                  )}
                >
                  <Controller
                    control={control}
                    name="amount"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary text-[16px]">
                          $
                        </span>
                        <input
                          ref={(el) => {
                            priceInputRef.current = el;
                            field.ref(el);
                          }}
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/[^0-9.]/g, '')
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' && e.shiftKey) {
                              e.preventDefault();
                              setActiveField('title');
                            }
                          }}
                          placeholder="0.00"
                          className="flex-1 bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
                          style={{ minWidth: '140px' }}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}
