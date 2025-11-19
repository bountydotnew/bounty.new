'use client';

import { authClient } from '@bounty/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@bounty/ui/components/dropdown-menu';
import { Spinner } from '@bounty/ui/components/spinner';
import { SwitchUsersIcon } from '@bounty/ui/components/switch-users';
import { Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

interface AccountSwitcherProps {
  currentUserId?: string;
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

export function AccountSwitcher({ currentUserId }: AccountSwitcherProps) {
  const router = useRouter();
  const [sessions, setSessions] = React.useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  // Load device sessions when component mounts
  React.useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await authClient.multiSession.listDeviceSessions();
        if (error) {
          console.error('Failed to load sessions:', error);
          return;
        }
        if (data) {
          setSessions(data as DeviceSession[]);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

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
        router.refresh();
      } catch (error) {
        toast.error('Failed to switch account. Please try again.');
        console.error('Failed to switch account:', error);
      } finally {
        setIsSwitching(false);
      }
    },
    [router]
  );

  const handleRemoveAccount = React.useCallback(
    async (sessionToken: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const { error } = await authClient.multiSession.revoke({
          sessionToken,
        });

        if (error) {
          toast.error('Failed to remove account. Please try again.');
          console.error('Failed to remove account:', error);
          return;
        }

        toast.success('Account removed successfully');
        setSessions((prev) =>
          prev.filter((s) => s.session.token !== sessionToken)
        );
      } catch (error) {
        toast.error('Failed to remove account. Please try again.');
        console.error('Failed to remove account:', error);
      }
    },
    []
  );

  const handleAddAccount = React.useCallback(() => {
    // Redirect to login page with a flag to add a new account
    router.push('/login?addAccount=true');
  }, [router]);

  if (isLoading) {
    return (
      <DropdownMenuGroup>
        <DropdownMenuItem disabled>
          <Spinner className="mr-2" size="sm" />
          Loading accounts...
        </DropdownMenuItem>
      </DropdownMenuGroup>
    );
  }

  // Only show if there are multiple sessions or potential for more
  const hasSessions = sessions.length > 1;

  if (!hasSessions) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <div className="px-2 py-1.5 text-muted-foreground text-xs font-medium">
          Switch Account
        </div>
        {sessions.map((deviceSession) => {
          const isActive = deviceSession.user.id === currentUserId;
          const initials = deviceSession.user.name
            ? deviceSession.user.name.charAt(0).toUpperCase()
            : '?';

          return (
            <DropdownMenuItem
              key={deviceSession.session.token}
              className="cursor-pointer"
              disabled={isSwitching || isActive}
              onClick={() =>
                !isActive && handleSwitchAccount(deviceSession.session.token)
              }
            >
              <div className="flex w-full items-center gap-2">
                <Avatar className="h-6 w-6">
                  {deviceSession.user.image && (
                    <AvatarImage
                      alt={deviceSession.user.name}
                      src={deviceSession.user.image}
                    />
                  )}
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col">
                  <span className="truncate text-sm">
                    {deviceSession.user.name}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {deviceSession.user.email}
                  </span>
                </div>
                {isActive && <Check className="h-4 w-4" />}
                {!isActive && (
                  <Button
                    className="h-6 w-6"
                    onClick={(e) =>
                      handleRemoveAccount(deviceSession.session.token, e)
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <span className="sr-only">Remove account</span>
                    ×
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleAddAccount}
        >
          <Plus className="h-4 w-4" />
          Add another account
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}
