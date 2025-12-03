'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@bounty/ui/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center justify-between px-3 pt-3 pb-2',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white'
        ),
        nav_button_previous: 'absolute left-3',
        nav_button_next: 'absolute right-3',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-[#5A5A5A] rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[#232323]/50 [&:has([aria-selected])]:bg-[#232323] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-[#232323] text-white hover:bg-[#232323] hover:text-white focus:bg-[#232323] focus:text-white',
        day_today: 'bg-[#1B1A1A] text-white',
        day_outside:
          'day-outside text-[#5A5A5A] opacity-50 aria-selected:bg-[#232323]/50 aria-selected:text-[#5A5A5A] aria-selected:opacity-30',
        day_disabled: 'text-[#5A5A5A] opacity-50',
        day_range_middle:
          'aria-selected:bg-[#232323] aria-selected:text-white',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

