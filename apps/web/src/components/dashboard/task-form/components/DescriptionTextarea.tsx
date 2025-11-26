import { useEffect, useRef } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';

interface DescriptionTextareaProps {
    control: Control<CreateBountyForm>;
    placeholder: string;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function DescriptionTextarea({ control, placeholder, textareaRef }: DescriptionTextareaProps) {
    useEffect(() => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 400);
            textarea.style.height = `${newHeight}px`;
        }
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
                        const target = e.target;
                        target.style.height = 'auto';
                        const newHeight = Math.min(Math.max(target.scrollHeight, 60), 400);
                        target.style.height = `${newHeight}px`;
                    }}
                    placeholder={placeholder}
                    className="flex-1 min-h-[60px] bg-transparent text-white text-[16px] leading-6 outline-none resize-none placeholder:text-[#5A5A5A]"
                />
            )}
        />
    );
}

