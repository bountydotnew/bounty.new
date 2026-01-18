'use client';

import { NotificationToast } from './notification-toast';
import { AlertTriangle } from 'lucide-react';
import type { ExternalToast } from 'sonner';
import { toast as sonnerToast } from 'sonner';

export type BountyReportedToastProps = {
  user: {
    name: string;
    image?: string | null;
  };
  timestamp: Date | string;
  onMarkAsRead?: () => void;
};

export function BountyReportedToast({
  user,
  timestamp,
  onMarkAsRead,
}: BountyReportedToastProps) {
  return (
    <NotificationToast
      id={0}
      user={user}
      message="Reported your bounty."
      timestamp={timestamp}
      actionIcon={<AlertTriangle className="size-2.5 fill-yellow-500 text-yellow-500" />}
      onDismiss={() => {}}
      onMarkAsRead={onMarkAsRead}
    />
  );
}

export function showBountyReportedToast(
  props: BountyReportedToastProps,
  toastOptions?: ExternalToast
) {
  return sonnerToast.custom(
    (id) => (
      <BountyReportedToast
        {...props}
        onMarkAsRead={() => {
          props.onMarkAsRead?.();
          sonnerToast.dismiss(id);
        }}
      />
    ),
    {
      duration: 5000,
      ...toastOptions,
    }
  );
}
