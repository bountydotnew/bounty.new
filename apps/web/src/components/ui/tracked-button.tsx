'use client';

import { type TrackProps, track, trackButtonClick } from '@bounty/track';
import * as React from 'react';
import { Button, type ButtonProps } from './button';

export interface TrackedButtonProps extends Omit<ButtonProps, 'onClick'> {
  trackEventName?: string;
  trackProperties?:
    | TrackProps
    | ((e: React.MouseEvent<HTMLButtonElement>) => TrackProps);
  trackDisabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const TrackedButton = React.forwardRef<HTMLButtonElement, TrackedButtonProps>(
  (
    {
      trackEventName = 'button_click',
      trackProperties,
      trackDisabled = false,
      onClick,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!trackDisabled) {
          const text =
            typeof children === 'string'
              ? children
              : (e.currentTarget.textContent || '').trim();
          const extra =
            typeof trackProperties === 'function'
              ? trackProperties(e)
              : trackProperties;
          const payload = {
            button_text: text || undefined,
            button_id: id || undefined,
            ...extra,
          };
          try {
            if (trackEventName === 'button_click') {
              Promise.resolve(trackButtonClick(payload)).catch(() => {});
            } else {
              Promise.resolve(track(trackEventName, payload)).catch(() => {});
            }
          } catch {}
        }
        if (onClick) {
          onClick(e);
        }
      },
      [trackDisabled, trackEventName, trackProperties, onClick, children, id]
    );

    return (
      <Button onClick={handleClick} ref={ref} {...props}>
        {children}
      </Button>
    );
  }
);
TrackedButton.displayName = 'TrackedButton';

export { TrackedButton };
