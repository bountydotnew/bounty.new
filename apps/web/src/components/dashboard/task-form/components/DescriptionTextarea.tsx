import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import { useAutoResizeTextarea } from '@bounty/ui';

interface DescriptionTextareaProps {
  control: Control<CreateBountyForm>;
  placeholder: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function DescriptionTextarea({
  control,
  placeholder,
  textareaRef,
}: DescriptionTextareaProps) {
  const resize = useAutoResizeTextarea(textareaRef, {
    minHeight: 100,
    maxHeight: 600,
  });

  return (
    <Controller
      control={control}
      name="description"
      render={({ field }) => (
        <textarea
          ref={(e) => {
            if (e) {
              textareaRef.current = e;
              field.ref(e);
            }
          }}
          value={field.value}
          onChange={(e) => {
            field.onChange(e.target.value);
            resize();
          }}
          placeholder={placeholder}
          className="flex-1 min-h-[100px] bg-transparent text-foreground text-[16px] leading-6 outline-none resize-none placeholder:text-text-tertiary"
        />
      )}
    />
  );
}
