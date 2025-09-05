'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function StatusFilter({
  value,
  onValueChange,
  className,
}: StatusFilterProps) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger className={className || 'w-[180px]'}>
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="approved">Approved</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  );
}
