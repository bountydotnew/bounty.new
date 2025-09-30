'use client';

import { cn } from '@bounty/ui/lib/utils';
import { timeAgo } from '@bounty/ui/lib/time-ago';
import { X } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import type { ReactNode } from 'react';

interface BaseToastProps {
  id: string | number;
}

interface NotificationToastProps extends BaseToastProps {
  type: 'notification';
  avatar?: string;
  username?: string;
  message: string;
  timestamp: Date | string;
  onMarkAsRead?: () => void;
  onDismiss?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

interface StatusToastProps extends BaseToastProps {
  type: 'status';
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

type CustomToastProps = NotificationToastProps | StatusToastProps;

function NotificationToast({
  id,
  avatar,
  username,
  message,
  timestamp,
  onMarkAsRead,
  onDismiss,
  primaryAction,
  secondaryAction,
}: NotificationToastProps) {
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    sonnerToast.dismiss(id);
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    sonnerToast.dismiss(id);
  };

  return (
    <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-lg backdrop-blur-sm">
      {avatar && username && (
        <Avatar className="size-10 shrink-0">
          <AvatarImage alt={username} src={avatar} />
          <AvatarFallback className="bg-neutral-800 text-neutral-300 text-sm">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          {username && (
            <span className="font-medium text-sm text-white">{username}</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-xs">{timeAgo(timestamp)}</span>
            <button
              className="text-neutral-500 transition-colors hover:text-neutral-300"
              onClick={handleDismiss}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <p className="mb-3 text-neutral-300 text-sm">{message}</p>
        {(secondaryAction || primaryAction) && (
          <div className="flex items-center gap-2">
            {secondaryAction && (
              <button
                className="text-neutral-400 text-xs transition-colors hover:text-neutral-200"
                onClick={() => {
                  secondaryAction.onClick();
                  sonnerToast.dismiss(id);
                }}
                type="button"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                onClick={() => {
                  primaryAction.onClick();
                  sonnerToast.dismiss(id);
                }}
                type="button"
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusToast({
  id,
  icon,
  title,
  description,
  variant = 'default',
}: StatusToastProps) {
  const handleDismiss = () => {
    sonnerToast.dismiss(id);
  };

  const variantStyles = {
    default: 'bg-neutral-800',
    success: 'bg-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/20 text-red-400',
    warning: 'bg-orange-500/20 text-orange-400',
    info: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="flex w-full max-w-md items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-lg backdrop-blur-sm">
      {icon && (
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            variantStyles[variant]
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm text-white">{title}</h3>
          <button
            className="text-neutral-500 transition-colors hover:text-neutral-300"
            onClick={handleDismiss}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {description && (
          <p className="text-neutral-400 text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}

export function CustomToast(props: CustomToastProps) {
  if (props.type === 'notification') {
    return <NotificationToast {...props} />;
  }
  return <StatusToast {...props} />;
}
