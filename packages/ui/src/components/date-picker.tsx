'use client';

import { useState } from 'react';
import { parseDate } from 'chrono-node';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';
import { Button } from '@bounty/ui/components/button';
import { Calendar } from '@bounty/ui/components/calendar';
import { Input } from '@bounty/ui/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@bounty/ui/components/popover';
import { cn } from '@bounty/ui/lib/utils';

function formatDate(date: Date | undefined) {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

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
  placeholder = 'Tomorrow or next week',
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState(value);
  const [date, setDate] = useState<Date | undefined>(
    value ? parseDate(value) || undefined : undefined
  );
  const [month, setMonth] = useState<Date | undefined>(date);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    const parsedDate = parseDate(newValue);
    if (parsedDate) {
      setDate(parsedDate);
      setMonth(parsedDate);
      onChange?.(formatDate(parsedDate));
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setTextValue(formatDate(selectedDate));
      onChange?.(formatDate(selectedDate));
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className={cn('relative flex-1', className)}>
      <Input
        id={id}
        value={textValue}
        placeholder={placeholder}
        className="bg-transparent border-0 pr-8 text-white text-base outline-none placeholder:text-[#5A5A5A] h-auto p-0"
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`${id}-picker`}
            variant="text"
            className="absolute top-1/2 right-0 size-4 -translate-y-1/2 p-0 h-auto"
          >
            <CalendarIcon className="size-4 text-[#5A5A5A]" />
            <span className="sr-only">Pick a date</span>
          </Button>
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
            month={month}
            onMonthChange={setMonth}
            onSelect={handleCalendarSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

