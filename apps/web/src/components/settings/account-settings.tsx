'use client';

import { useSession } from '@/context/session-context';
import { useUser } from '@/context/user-context';
import { useTheme } from 'next-themes';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { Switch } from '@bounty/ui/components/switch';
import { Loader2, Check, Lock, LogOut } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';

// Section wrapper component
function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 w-full px-4 py-5 border-b border-border-subtle">
      {children}
    </div>
  );
}

// Section title component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-medium text-foreground">{children}</h2>;
}

// Section item title
function ItemTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-foreground">{children}</h3>
  );
}

// User profile row at the top
function UserProfileRow() {
  const { session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-4 w-full px-4 py-4 border-b border-border-subtle">
        <Loader2 className="size-9 animate-spin text-text-tertiary" />
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
          <div className="h-4 w-40 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const user = session?.user;
  const userName = user?.name || 'Anonymous';
  const userEmail = user?.email || '';
  const userImage = user?.image;

  return (
    <div className="flex items-center gap-4 w-full px-4 py-4 border-b border-border-subtle">
      <Avatar className="size-9">
        <AvatarImage src={userImage ?? undefined} alt={userName} />
        <AvatarFacehash name={userName || userEmail} size={36} />
      </Avatar>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground">
          {userName}
        </span>
        <span className="text-sm text-text-secondary">{userEmail}</span>
      </div>
    </div>
  );
}

// Theme option card - fixed size for the preview cards
function ThemeOption({
  theme,
  label,
  isSelected,
  onSelect,
  imageSrc,
}: {
  theme: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  imageSrc: string;
}) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={cn(
          'w-32 aspect-[131/95] rounded-xl overflow-hidden relative transition-all',
          isDark ? 'bg-surface-1' : 'bg-[#EEEDE9]',
          isSelected
            ? 'ring-1 ring-text-secondary'
            : 'ring-1 ring-transparent group-hover:ring-border-subtle'
        )}
      >
        <div className="absolute inset-3 flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={`${label} theme preview`}
            fill
            className={cn('rounded object-contain', !isDark && 'shadow-sm')}
          />
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 size-4 rounded-full bg-foreground flex items-center justify-center">
            <Check className="size-2.5 text-background" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Coming soon placeholder
function ComingSoonOption({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-32 aspect-[131/95] rounded-xl flex flex-col items-center justify-center gap-2 p-4 ring-1 ring-border-subtle">
        <Lock className="size-5 text-text-tertiary opacity-30" />
        <span className="text-[10px] text-center font-semibold text-text-tertiary">
          {label}
        </span>
      </div>
    </div>
  );
}

// Privacy section
function PrivacySection() {
  const { user: userData } = useUser();
  const queryClient = useQueryClient();
  const [isProfilePrivate, setIsProfilePrivate] = useState(false);

  const updateProfilePrivacyMutation = useMutation(
    trpc.user.updateProfilePrivacy.mutationOptions({
      onSuccess: () => {
        const userQueryKey = trpc.user.getMe.queryOptions().queryKey;
        queryClient.invalidateQueries({ queryKey: userQueryKey });

        if (userData?.handle) {
          const profileQueryKey = trpc.profiles.getProfile.queryOptions({
            handle: userData.handle,
          }).queryKey;
          queryClient.invalidateQueries({ queryKey: profileQueryKey });
        }
        if (userData?.id) {
          const profileQueryKeyById = trpc.profiles.getProfile.queryOptions({
            userId: userData.id,
          }).queryKey;
          queryClient.invalidateQueries({ queryKey: profileQueryKeyById });
        }
      },
    })
  );

  useEffect(() => {
    if (userData?.isProfilePrivate !== undefined) {
      setIsProfilePrivate(userData.isProfilePrivate);
    }
  }, [userData?.isProfilePrivate]);

  const handlePrivacyToggle = useCallback(
    async (value: boolean) => {
      setIsProfilePrivate(value);
      try {
        await updateProfilePrivacyMutation.mutateAsync({
          isProfilePrivate: value,
        });
        toast.success(`Profile is now ${value ? 'private' : 'public'}`);
      } catch {
        setIsProfilePrivate(!value);
        toast.error('Failed to update privacy settings');
      }
    },
    [updateProfilePrivacyMutation]
  );

  return (
    <SettingsSection>
      <SectionTitle>Privacy</SectionTitle>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <ItemTitle>Private profile</ItemTitle>
          <p className="text-sm text-text-secondary">
            When enabled, only you can view your profile. Others will see a
            private profile message.
          </p>
        </div>
        <Switch
          checked={isProfilePrivate}
          disabled={updateProfilePrivacyMutation.isPending}
          onCheckedChange={handlePrivacyToggle}
        />
      </div>
    </SettingsSection>
  );
}

// Appearance section
function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection>
      <SectionTitle>Appearance</SectionTitle>

      {/* Theme selector */}
      <div className="flex flex-col gap-4">
        <ItemTitle>Theme</ItemTitle>
        <div className="flex flex-wrap items-start gap-4">
          <ThemeOption
            theme="dark"
            label="Dark"
            isSelected={theme === 'dark'}
            onSelect={() => setTheme('dark')}
            imageSrc="/images/mockups/theme/dark.png"
          />
          <ThemeOption
            theme="light"
            label="Light"
            isSelected={theme === 'light'}
            onSelect={() => setTheme('light')}
            imageSrc="/images/mockups/theme/light.png"
          />
          <ComingSoonOption label="More themes coming soon" />
        </div>
      </div>

      {/* Cursor selector */}
      <div className="flex flex-col gap-4">
        <ItemTitle>Cursor</ItemTitle>
        <div className="flex flex-wrap items-start gap-4">
          <ComingSoonOption label="Custom cursors coming soon" />
        </div>
      </div>
    </SettingsSection>
  );
}

// Account actions section
function AccountActionsSection() {
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch {
      toast.error('Failed to sign out');
    }
  }, [router]);

  return (
    <SettingsSection>
      <SectionTitle>Account actions</SectionTitle>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <ItemTitle>Sign out</ItemTitle>
          <p className="text-sm text-text-secondary">
            Sign out of your account on this device
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </SettingsSection>
  );
}

export function AccountSettings() {
  return (
    <div className="flex flex-col w-full">
      <UserProfileRow />
      <PrivacySection />
      <AppearanceSection />
      <AccountActionsSection />
    </div>
  );
}
