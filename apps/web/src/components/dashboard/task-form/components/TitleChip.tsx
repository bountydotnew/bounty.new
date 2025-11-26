import { useRef, useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import { calculateWidth } from '@bounty/ui/lib/calculateWidth';

interface TitleChipProps {
    control: Control<CreateBountyForm>;
}

export function TitleChip({ control }: TitleChipProps) {
    const titleRef = useRef<HTMLInputElement>(null);
    const [isTitleFocused, setIsTitleFocused] = useState(false);

    return (
        <div className="relative rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-1">
            <Controller
                control={control}
                name="title"
                render={({ field }) => {
                    const hasFieldValue = Boolean(field.value);
                    const isNotFocused = !isTitleFocused;
                    const showPlaceholder = !hasFieldValue && isNotFocused;
                    const shouldUseWiderWidth = isTitleFocused || hasFieldValue;
                    const minWidth = shouldUseWiderWidth ? 60 : 20;
                    const inputWidth = calculateWidth(field.value, minWidth);
                    
                    return (
                        <>
                            {showPlaceholder && (
                                <span className="text-[#5A5A5A] text-[16px] leading-5 font-normal pointer-events-none">Title</span>
                            )}
                            <input
                                ref={(e) => {
                                    if (e) {
                                        titleRef.current = e;
                                        field.ref(e);
                                    }
                                }}
                                type="text"
                                value={field.value}
                                onChange={field.onChange}
                                onFocus={() => setIsTitleFocused(true)}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsTitleFocused(false);
                                    }, 200);
                                }}
                                className="bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#3a3a3a]"
                                style={{ width: `${inputWidth}px` }}
                            />
                        </>
                    );
                }}
            />
        </div>
    );
}
