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

  const handleContainerClick = () => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  };

  return (
    <div
      className="relative rounded-[7px] flex flex-row items-center px-1.5 py-[3px] bg-[#201F1F] gap-1 cursor-text"
      onClick={handleContainerClick}
    >
      <Controller
        control={control}
        name="title"
        render={({ field }) => {
          const hasFieldValue = Boolean(field.value);
          const isNotFocused = !isTitleFocused;
          const showPlaceholder = !hasFieldValue && isNotFocused;
          const shouldUseWiderWidth = isTitleFocused || hasFieldValue;
          // Ensure minimum width covers the placeholder text
          const minWidth = shouldUseWiderWidth ? 60 : 50;
          const inputWidth = calculateWidth(field.value || 'Title', minWidth);

          return (
            <>
              {showPlaceholder && (
                <span className="text-[#5A5A5A] text-[16px] leading-5 font-normal pointer-events-none absolute left-1.5">
                  Title
                </span>
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
                className="bg-transparent text-white text-[16px] leading-5 outline-none placeholder:text-[#5A5A5A]"
                style={{ width: `${inputWidth}px` }}
              />
            </>
          );
        }}
      />
    </div>
  );
}
