'use client';

import { authClient } from '@bounty/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bounty/ui/components/popover';
import { Spinner } from '@bounty/ui/components/spinner';
import { Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AccountSwitcherProps {
  currentUserId?: string;
  trigger?: React.ReactNode;
}

interface DeviceSession {
  session: {
    token: string;
    userId: string;
    expiresAt: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export function AccountSwitcher({
  currentUserId,
  trigger,
}: AccountSwitcherProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  // Use React Query to fetch device sessions (prefetched in usePrefetchInitialData)
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['auth', 'multiSession', 'listDeviceSessions'],
    queryFn: async () => {
      const { data, error } =
        await authClient.multiSession.listDeviceSessions();
      if (error) {
        console.error('Failed to load sessions:', error);
        return [];
      }
      return (data as DeviceSession[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const handleSwitchAccount = React.useCallback(
    async (sessionToken: string) => {
      setIsSwitching(true);
      try {
        const { error } = await authClient.multiSession.setActive({
          sessionToken,
        });

        if (error) {
          toast.error('Failed to switch account. Please try again.');
          console.error('Failed to switch account:', error);
          return;
        }

        toast.success('Switched account successfully');
        // Invalidate all queries to refresh auth-dependent data
        queryClient.invalidateQueries();
        // Close popover
        setPopoverOpen(false);
        // Refresh the page to update all components
        router.refresh();
      } catch (error) {
        toast.error('Failed to switch account. Please try again.');
        console.error('Failed to switch account:', error);
      } finally {
        setIsSwitching(false);
      }
    },
    [router, queryClient]
  );

  const handleAddAccount = React.useCallback(() => {
    // Redirect to login page with a flag to add a new account
    router.push('/login?addAccount=true');
  }, [router]);

  const content = (
    <PopoverContent
      className="w-56 rounded-lg border border-[#232323] bg-[#141414] p-2 shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
      align="start"
      sideOffset={8}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-2 py-2">
          <Spinner className="h-4 w-4" size="sm" />
          <span className="text-sm text-text-secondary">
            Loading accounts...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {sessions.map((deviceSession) => {
            const isActive = deviceSession.user.id === currentUserId;
            const initials = deviceSession.user.name
              ? deviceSession.user.name.charAt(0).toUpperCase()
              : '?';

            return (
              <button
                key={deviceSession.session.token}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#232323] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSwitching || isActive}
                onClick={() =>
                  !isActive && handleSwitchAccount(deviceSession.session.token)
                }
                type="button"
                aria-label={`Switch to ${deviceSession.user.name}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {deviceSession.user.image && (
                    <AvatarImage
                      alt={deviceSession.user.name}
                      src={deviceSession.user.image}
                    />
                  )}
                  <AvatarFallback className="text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-medium leading-[150%] text-white truncate">
                    {deviceSession.user.name}
                  </span>
                  <span className="text-xs leading-[150%] text-[#999999] truncate">
                    {deviceSession.user.email}
                  </span>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}

          {/* Add new account button */}
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#232323]"
            onClick={handleAddAccount}
            type="button"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#383838]">
              <Plus className="h-4 w-4 text-text-secondary" />
            </div>
            <span className="text-sm font-medium leading-[150%] text-text-secondary">
              Add new account
            </span>
          </button>
        </div>
      )}
    </PopoverContent>
  );

  if (trigger) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        {content}
      </Popover>
    );
  }

  // Fallback: render content directly if no trigger provided (for backwards compatibility)
  return <>{content}</>;
}
