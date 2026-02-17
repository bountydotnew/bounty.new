import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bounty/ui/components/popover';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';

interface TitleChipProps {
  control: Control<CreateBountyForm>;
}

export function TitleChip({ control }: TitleChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-full flex justify-center items-center px-[6px] py-[3px] shrink-0 gap-2 bg-surface-hover border border-solid border-border-subtle hover:border-border-default transition-colors cursor-pointer">
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
      </PopoverTrigger>
      <PopoverContent
        className="w-64 px-3 bg-surface-1 border-border-subtle rounded-xl py-2"
        align="start"
        sideOffset={8}
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <input
              ref={field.ref}
              type="text"
              value={field.value}
              onChange={field.onChange}
              placeholder="Enter a title"
              className="w-full bg-transparent text-foreground text-[16px] leading-5 outline-none placeholder:text-text-tertiary"
              autoFocus
            />
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
