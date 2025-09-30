'use client';

import { toast as sonnerToast } from 'sonner';
import { CustomToast } from '../components/custom-toast';
import type { ReactNode } from 'react';

interface NotificationToastOptions {
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

interface StatusToastOptions {
  type?: 'status';
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

type ToastOptions = NotificationToastOptions | StatusToastOptions;

function isNotificationToast(
  options: ToastOptions
): options is NotificationToastOptions {
  return options.type === 'notification';
}

export function toast(options: ToastOptions) {
  return sonnerToast.custom((id) => {
    if (isNotificationToast(options)) {
      return (
        <CustomToast
          avatar={options.avatar}
          id={id}
          message={options.message}
          onDismiss={options.onDismiss}
          onMarkAsRead={options.onMarkAsRead}
          primaryAction={options.primaryAction}
          secondaryAction={options.secondaryAction}
          timestamp={options.timestamp}
          type="notification"
          username={options.username}
        />
      );
    }

    return (
      <CustomToast
        description={options.description}
        icon={options.icon}
        id={id}
        title={options.title}
        type="status"
        variant={options.variant}
      />
    );
  });
}

export const toastSuccess = (title: string, description?: string) =>
  toast({ type: 'status', title, description, variant: 'success' });

export const toastError = (title: string, description?: string) =>
  toast({ type: 'status', title, description, variant: 'error' });

export const toastWarning = (title: string, description?: string) =>
  toast({ type: 'status', title, description, variant: 'warning' });

export const toastInfo = (title: string, description?: string) =>
  toast({ type: 'status', title, description, variant: 'info' });
