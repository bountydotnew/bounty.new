'use client';

import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { cn } from '@bounty/ui/lib/utils';

interface NavBreadcrumbsProps {
  items?: {
    title: string;
    url: string;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  className?: string;
}

export function NavBreadcrumbs({ items = [], className }: NavBreadcrumbsProps) {
  const pathname = usePathname();

  // Find the current navigation context from sidebar items
  const findCurrentNavigation = () => {
    const breadcrumbs: { title: string; url: string }[] = [];

    // Always start with home
    breadcrumbs.push({ title: 'Home', url: '/' });

    // Find matching navigation items
    for (const item of items) {
      if (pathname.startsWith(item.url) && item.url !== '/') {
        breadcrumbs.push({ title: item.title, url: item.url });

        // Check sub-items
        if (item.items) {
          for (const subItem of item.items) {
            if (
              pathname === subItem.url ||
              pathname.startsWith(`${subItem.url}/`)
            ) {
              breadcrumbs.push({ title: subItem.title, url: subItem.url });
              break;
            }
          }
        }
        break;
      }
    }

    // If no navigation match found, generate from pathname
    if (breadcrumbs.length === 1 && pathname !== '/') {
      const segments = pathname.split('/').filter(Boolean);
      segments.forEach((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join('/')}`;
        const title = decodeURIComponent(segment)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        breadcrumbs.push({ title, url });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = findCurrentNavigation();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center space-x-1 text-muted-foreground text-sm',
        className
      )}
    >
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isFirst = index === 0;

        return (
          <div className="flex items-center" key={breadcrumb.url}>
            {isFirst ? (
              <Link
                className="flex items-center transition-colors hover:text-foreground"
                href={breadcrumb.url}
              >
                <Home className="h-4 w-4" />
              </Link>
            ) : isLast ? (
              <span className="font-medium text-foreground">
                {breadcrumb.title}
              </span>
            ) : (
              <Link
                className="transition-colors hover:text-foreground"
                href={breadcrumb.url}
              >
                {breadcrumb.title}
              </Link>
            )}

            {!isLast && <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0" />}
          </div>
        );
      })}
    </nav>
  );
}
