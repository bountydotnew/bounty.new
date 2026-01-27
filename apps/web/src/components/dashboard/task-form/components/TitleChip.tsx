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
                <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] shrink-0 gap-2 bg-[#141414] border border-solid border-[#232323] hover:border-[#333] transition-colors cursor-pointer">
                    <Controller
                        control={control}
                        name="title"
                        render={({ field }) => {
                            const displayValue = field.value || 'Title';
                            return (
                                <span className={`text-[16px] leading-5 font-sans ${
                                    field.value ? 'text-white' : 'text-[#7C7878]'
                                }`}>
                                    {displayValue}
                                </span>
                            );
                        }}
                    />
                    <ChevronSortIcon className="size-2 text-[#7D7878] shrink-0" />
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-64 p-3 bg-[#191919] border-[#232323] rounded-xl"
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
                            className="w-full bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#5A5A5A]"
                            autoFocus
                        />
                    )}
                />
            </PopoverContent>
        </Popover>
    );
}
