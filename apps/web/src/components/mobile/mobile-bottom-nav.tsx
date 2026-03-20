'use client';

import { cn } from '@bounty/ui/lib/utils';
import {
  HomeIcon,
  DashboardSquareIcon,
  BookmarksIcon,
  PlusIcon,
} from '@bounty/ui';
import { useHaptics } from '@bounty/ui/hooks/use-haptics';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { useSession } from '@/context/session-context';

interface MobileBottomNavProps {
  onCreateClick?: () => void;
}

export function MobileBottomNav({ onCreateClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const user = session?.user as
    | (NonNullable<typeof session>['user'] & { handle?: string | null })
    | undefined;
  const haptics = useHaptics();

  const handleNavClick = () => {
    haptics.trigger('selection');
  };

  const handleCreateClick = () => {
    haptics.trigger('medium');
    onCreateClick?.();
  };

  const navItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Home' },
    { href: '/bounties', icon: DashboardSquareIcon, label: 'Bounties' },
    { type: 'create' as const },
    { href: '/bookmarks', icon: BookmarksIcon, label: 'Bookmarks' },
    { type: 'profile' as const },
  ];

  const profileHref = user?.handle
    ? `/@${user.handle}`
    : user?.id
      ? `/profile/${user.id}`
      : '/auth/signin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[74px] items-center justify-between rounded-t-[14px] border-t border-border-subtle bg-surface-1 px-7 py-5 md:hidden">
      {navItems.map((item, index) => {
        if (item.type === 'create') {
          return (
            <button
              key="create"
              type="button"
              onClick={handleCreateClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background active:scale-95 transition-transform"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          );
        }

        if (item.type === 'profile') {
          return (
            <Link
              key="profile"
              href={profileHref}
              onClick={handleNavClick}
              className="flex h-[30px] w-[30px] items-center rounded-full bg-surface-2 p-px active:opacity-70 transition-opacity"
            >
              <Avatar className="size-full rounded-full">
                {user?.image && (
                  <AvatarImage alt={user.name ?? ''} src={user.image} />
                )}
                <AvatarFacehash
                  name={user?.name ?? user?.email ?? 'User'}
                  size={28}
                />
              </Avatar>
            </Link>
          );
        }

        const Icon = item.icon!;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={handleNavClick}
            className={cn(
              'flex h-[29px] w-[29px] items-center justify-center active:opacity-70 transition-opacity',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-[22px] w-[22px]" />
          </Link>
        );
      })}
    </nav>
  );
}
