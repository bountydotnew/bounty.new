'use client';

import { cn } from '@bounty/ui/lib/utils';
import { track } from '@databuddy/sdk';
import { type LinkProps, default as NextLink } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

const trackLinkClick = (linkName: string) => {
  track('link_click', { link_name: linkName });
};

function getLinkName(
  href: Props['href'],
  linkName?: string,
): string {
  if (linkName && typeof linkName === 'string') {
    return linkName;
  }
  if (typeof href === 'string') {
    return href;
  }
  if (href && typeof href === 'object' && 'pathname' in href && typeof (href as { pathname?: string }).pathname === 'string') {
    return (href as { pathname: string }).pathname;
  }
  return 'unknown';
}

interface TrackingEventObject {
  [key: string]: string | number | boolean | null | undefined;
}

type Props = ComponentPropsWithoutRef<'a'> &
  LinkProps & {
    event?: string;
    eventObject?: TrackingEventObject;
    /** Analytics: human-readable name for link_click (avoids [object Object] when children is a React node). */
    linkName?: string;
  };

export default function Link({
  className,
  href,
  children,
  event,
  eventObject,
  linkName,
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
        trackLinkClick(getLinkName(href, linkName));
        onClick?.(e);
      }}
    >
      {children}
    </NextLink>
  );
}
