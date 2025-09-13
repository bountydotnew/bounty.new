'use client';

import { track } from '@databuddy/sdk';
import { type LinkProps, default as NextLink } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@bounty/ui/lib/utils';

const trackLinkClick = (linkName: string) => {
  track('next/link_click', { link_name: linkName });
};

interface TrackingEventObject {
  [key: string]: string | number | boolean | null | undefined;
}

type Props = ComponentPropsWithoutRef<'a'> &
  LinkProps & {
    event?: string;
    eventObject?: TrackingEventObject;
  };

export default function Link({
  className,
  href,
  children,
  event,
  eventObject,
  onClick,
  ...props
}: Props) {
  return (
    <NextLink
      className={cn(className)}
      href={href}
      {...props}
      onClick={(e) => {
        if (event) {
          track(event, eventObject);
        }
        if (onClick) {
          trackLinkClick(children?.toString() ?? '');
          onClick(e);
        }
      }}
    >
      {children}
    </NextLink>
  );
}
