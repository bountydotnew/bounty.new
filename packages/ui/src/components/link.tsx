'use client';

import { track } from '@databuddy/sdk';
import { type LinkProps, default as NextLink } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@bounty/ui/lib/utils';

const trackLinkClick = (linkName: string) => {
  track('next/link_click', { link_name: linkName });
};

type Props = ComponentPropsWithoutRef<'a'> &
  LinkProps & {
    event?: string;
    // TODO: add type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventObject?: Record<string, any>;
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
