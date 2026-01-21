'use client';

import { Loader2, MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';

interface ActionButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'icon';
  className?: string;
}

export function ActionButton({
  children,
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  className,
}: ActionButtonProps) {
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`h-[29px] w-[29px] rounded-[7px] text-[#888] hover:text-white hover:bg-[#303030] transition-colors flex items-center justify-center disabled:opacity-50 ${className}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`h-[29px] px-3 rounded-[7px] bg-[#303030] text-[13px] text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-1.5 disabled:opacity-50 ${className}`}
    >
      {children}
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="h-4 w-4 flex items-center justify-center">{icon}</span>
      ) : null}
    </button>
  );
}

interface DropdownAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionButtonGroupProps {
  children?: ReactNode;
  dropdownActions?: DropdownAction[];
}

export function ActionButtonGroup({
  children,
  dropdownActions = [],
}: ActionButtonGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {children}
      {dropdownActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-[29px] w-[29px] rounded-[7px] text-[#888] hover:text-white hover:bg-[#303030] transition-colors flex items-center justify-center"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#191919] border-[#2a2a2a]"
          >
            {dropdownActions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                className={
                  action.variant === 'danger'
                    ? 'text-red-400 focus:text-red-400 focus:bg-[#232323]'
                    : 'focus:bg-[#232323]'
                }
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && (
                  <span className="mr-2 h-4 w-4">{action.icon}</span>
                )}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
