import { useState, useEffect } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@bounty/ui/components/popover';
import { Calendar } from '@bounty/ui/components/calendar';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';
import { parseDate } from 'chrono-node';

interface DeadlineChipProps {
    control?: Control<CreateBountyForm>;
    value?: string;
    onChange?: (value: string) => void;
}

function formatDate(date: Date | undefined): string {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function parseFieldValue(value: string | undefined): Date | undefined {
    if (!value) {
        return;
    }
    // Try parsing as ISO date string first
    try {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    } catch {
        // Invalid date
    }
    // Try natural language parsing
    return parseDate(value) || undefined;
}

interface DeadlinePickerProps {
    value: string;
    onChange: (value: string) => void;
}

function DeadlinePicker({ value, onChange }: DeadlinePickerProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [date, setDate] = useState<Date | undefined>(() => parseFieldValue(value));

    useEffect(() => {
        const parsed = parseFieldValue(value);
        setDate(parsed);
        setInputValue(parsed ? formatDate(parsed) : '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Parse natural language input
        const parsed = parseDate(newValue);
        if (parsed) {
            setDate(parsed);
            onChange(parsed.toISOString());
        } else {
            // If not a valid date, still update the form value
            // This allows for partial input like "tomorr" that will be completed
            onChange(newValue);
        }
    };

    const handleCalendarSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const isoString = selectedDate.toISOString();
            setDate(selectedDate);
            setInputValue(formatDate(selectedDate));
            onChange(isoString);
        } else {
            setDate();
            setInputValue('');
            onChange('');
        }
        setOpen(false);
    };

    return (
        <div className="relative flex">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Deadline, e.g. tomorrow"
                className="rounded-full flex justify-center items-center px-[11px] py-[6px] bg-[#141414] border border-solid border-[#232323] hover:border-[#333] transition-colors text-[16px] leading-5 font-sans placeholder:text-[#7C7878] text-white focus:outline-none focus:border-[#444] pr-8 min-w-[100px]"
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-[#7C7878] hover:text-white transition-colors"
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#191919] border-[#232323]" align="start" sideOffset={8}>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleCalendarSelect}
                        month={date || new Date()}
                        captionLayout="dropdown"
                        disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const compareDate = new Date(date);
                            compareDate.setHours(0, 0, 0, 0);
                            return compareDate < today;
                        }}
                        initialFocus
                        startMonth={new Date()}
                        endMonth={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function DeadlineChip({ control, value: controlledValue, onChange: controlledOnChange }: DeadlineChipProps) {
    // Controlled mode
    if (controlledOnChange !== undefined) {
        return <DeadlinePicker value={controlledValue ?? ''} onChange={controlledOnChange} />;
    }

    // React Hook Form integration
    return (
        <Controller
            control={control}
            name="deadline"
            render={({ field }) => <DeadlinePicker value={field.value ?? ''} onChange={field.onChange} />}
        />
    );
}
