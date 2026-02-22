'use client';

import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from 'react-day-picker';
import { cn } from '@bounty/ui/lib/utils';
import { ChevronLeftIcon } from '@bounty/ui/components/icons/huge/chevron-left';
import { ChevronRightIcon } from '@bounty/ui/components/icons/huge/chevron-right';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();
  const isDropdownLayout =
    captionLayout === 'dropdown' ||
    captionLayout === 'dropdown-months' ||
    captionLayout === 'dropdown-years';

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('bg-transparent group/calendar p-3', className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString('default', { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('flex flex-col gap-4 relative', defaultClassNames.months),
        month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
        nav: cn(
          isDropdownLayout
            ? 'flex items-center gap-1 w-full justify-between'
            : 'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between z-10',
          defaultClassNames.nav
        ),
        button_previous: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md transition-colors text-foreground hover:bg-surface-hover',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center rounded-md transition-colors text-foreground hover:bg-surface-hover',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          isDropdownLayout
            ? 'flex items-center justify-between h-7 w-full px-1 relative'
            : 'flex items-center justify-center h-7 w-full px-1 relative',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'w-full flex items-center text-sm font-medium justify-center h-7 gap-1.5',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          isDropdownLayout
            ? 'relative bg-surface-1 border border-border-subtle rounded-md hover:bg-surface-hover transition-colors px-2'
            : 'relative bg-surface-1 border border-border-subtle rounded-md hover:bg-surface-hover transition-colors',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          isDropdownLayout
            ? 'relative bg-transparent text-foreground text-sm font-medium px-1 py-0.5 focus:outline-none appearance-none'
            : 'absolute bg-popover inset-0 opacity-0',
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          isDropdownLayout
            ? 'sr-only'
            : 'select-none font-medium text-sm text-foreground',
          defaultClassNames.caption_label
        ),
        table: 'w-full border-collapse',
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-text-tertiary rounded-md flex-1 font-normal text-[0.8rem] select-none',
          defaultClassNames.weekday
        ),
        week: cn('flex w-full mt-2', defaultClassNames.week),
        week_number_header: cn(
          'select-none w-8',
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          'text-[0.8rem] select-none text-text-tertiary',
          defaultClassNames.week_number
        ),
        day: cn(
          'relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
          defaultClassNames.day
        ),
        range_start: cn(
          'rounded-l-md bg-primary text-primary-foreground',
          defaultClassNames.range_start
        ),
        range_middle: cn(
          'rounded-none bg-primary text-primary-foreground',
          defaultClassNames.range_middle
        ),
        range_end: cn(
          'rounded-r-md bg-primary text-primary-foreground',
          defaultClassNames.range_end
        ),
        today: cn(
          'bg-surface-3 text-foreground rounded-md data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn(
          'text-text-tertiary aria-selected:text-text-tertiary',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-text-tertiary opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className="h-4 w-4" />;
          }
          return <ChevronRightIcon className="h-4 w-4" />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex w-8 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-primary data-[range-middle=true]:text-primary-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring/50 flex aspect-square w-full min-w-8 flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md rounded-md transition-colors hover:bg-surface-hover text-foreground',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
