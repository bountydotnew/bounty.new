'use client';

import { useState, useEffect, useRef } from 'react';
import { parseDate } from 'chrono-node';
import { Button } from '@bounty/ui/components/button';
import { Calendar } from '@bounty/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bounty/ui/components/popover';
import { cn, formatDateLong } from '@bounty/ui/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Deadline, e.g. tomorrow',
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Helper to parse value (ISO string or natural language)
  const parseValue = (
    val: string
  ): { date: Date | undefined; text: string } => {
    if (!val) {
      return { date: undefined, text: '' };
    }

    // Try parsing as ISO string first
    try {
      const isoDate = new Date(val);
      if (!Number.isNaN(isoDate.getTime())) {
        return { date: isoDate, text: formatDateLong(isoDate) };
      }
    } catch {
      // Not an ISO string, continue
    }

    // Try parsing as natural language
    const parsed = parseDate(val);
    if (parsed) {
      return { date: parsed, text: formatDateLong(parsed) };
    }

    // If neither works, return empty
    return { date: undefined, text: '' };
  };

  const initialParse = parseValue(value);
  const [textValue, setTextValue] = useState(initialParse.text);
  const [date, setDate] = useState<Date | undefined>(initialParse.date);
  const [month, setMonth] = useState<Date | undefined>(initialParse.date);

  // Sync with external value changes (only when not actively typing)
  useEffect(() => {
    if (!isTypingRef.current) {
      const parsed = parseValue(value);
      setTextValue(parsed.text);
      setDate(parsed.date);
      if (parsed.date) {
        setMonth(parsed.date);
      }
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    isTypingRef.current = true;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced onChange (fires AFTER user stops typing)
    debounceTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;

      const parsedDate = parseDate(newValue);
      if (parsedDate) {
        const formatted = formatDateLong(parsedDate);
        setDate(parsedDate);
        setMonth(parsedDate);
        setTextValue(formatted); // Update to formatted version
        onChange?.(parsedDate.toISOString());
      } else if (newValue === '') {
        setDate(undefined);
        setMonth(undefined);
        onChange?.('');
      } else {
        // Invalid input, keep what user typed but don't call onChange
        // This allows them to continue typing
      }
    }, 200);
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = formatDateLong(selectedDate);
      setTextValue(formatted);
      onChange?.(selectedDate.toISOString());
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative flex-1', className)}>
      <input
        id={id}
        value={textValue}
        placeholder={placeholder}
        className="bg-transparent text-foreground text-base outline-none placeholder:text-text-tertiary h-auto p-0 w-full border-0"
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={`${id}-picker`}
              variant="ghost"
              className="absolute top-1/2 right-0 size-4 -translate-y-1/2 p-0 h-auto"
            />
          }
        >
          <span className="sr-only">Pick a date</span>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={date}
            month={month || new Date()}
            onMonthChange={setMonth}
            onSelect={handleCalendarSelect}
            disabled={(date) => {
              // Disable past dates (before today)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const compareDate = new Date(date);
              compareDate.setHours(0, 0, 0, 0);
              return compareDate < today;
            }}
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-0',
              caption: 'flex justify-center pt-3 pb-2 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'flex items-center justify-between px-3 pt-0 pb-0 absolute top-0 left-0 right-0',
              nav_button:
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-foreground',
              nav_button_previous: 'absolute left-3',
              nav_button_next: 'absolute right-3',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
