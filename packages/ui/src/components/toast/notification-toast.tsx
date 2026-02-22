'use client';

import { Avatar, AvatarFacehash, AvatarImage } from '../avatar';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReactNode } from 'react';

export type NotificationToastProps = {
  id: string | number;
  user: {
    name: string;
    image?: string | null;
  };
  message: string;
  timestamp: Date | string;
  actionIcon?: ReactNode;
  onDismiss: () => void;
  onMarkAsRead?: () => void;
};

export function NotificationToast({
  user,
  message,
  timestamp,
  actionIcon,
  onDismiss,
  onMarkAsRead,
}: NotificationToastProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <div className="relative flex flex-col gap-3">
      {/* Header: Avatar, User Info, Dismiss */}
      <div className="flex items-start gap-3">
        {/* Avatar with action icon overlay */}
        <div className="relative flex-shrink-0">
          <Avatar className="size-8 rounded-full bg-brand-primary">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFacehash name={user.name} size={32} />
          </Avatar>
          {/* Action icon overlay */}
          {actionIcon && (
            <div className="absolute -bottom-1.5 -right-1.5">{actionIcon}</div>
          )}
        </div>

        {/* User name and timestamp */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-foreground leading-[150%] tracking-[-0.03em] whitespace-nowrap">
            {user.name}
          </span>
          <span className="text-xs text-text-muted leading-[150%] tracking-[-0.04em] shrink-0 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 cursor-pointer text-text-muted hover:text-foreground transition-colors ml-auto"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Message */}
      <p className="text-[11px] leading-[150%] tracking-[0.01em] text-foreground font-normal">
        {message}
      </p>

      {/* Mark as Read button */}
      {onMarkAsRead && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkAsRead}
            className="text-[11px] leading-[150%] tracking-[0.02em] text-right text-text-muted font-semibold hover:text-foreground transition-colors cursor-pointer"
          >
            Mark as Read
          </button>
        </div>
      )}
    </div>
  );
}
