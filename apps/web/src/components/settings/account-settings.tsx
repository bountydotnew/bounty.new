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
import { Badge } from '@bounty/ui/components/badge';
import { Input } from '@bounty/ui/components/input';
import { Switch } from '@bounty/ui/components/switch';
import {
  Loader2,
  Check,
  Lock,
  LogOut,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';
import { setHandleSchema, type SetHandleForm } from '@bounty/ui/lib/forms';
import { getFirstError } from '@bounty/ui/lib/form-errors';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOptionalTour } from '@bounty/ui/components/tour';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { GithubIcon } from '../icons';
import GoogleIcon from '../icons/google';

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

// User profile + username section
function UserProfileSection() {
  const { session, isPending: sessionPending } = useSession();
  const { user: currentUser } = useUser();

  if (sessionPending) {
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
  const userHandle = currentUser?.handle;

  return (
    <>
      {/* Profile display row */}
      <div className="flex items-center gap-4 w-full px-4 py-4 border-b border-border-subtle">
        <Avatar className="size-9">
          <AvatarImage src={userImage ?? undefined} alt={userName} />
          <AvatarFacehash name={userName || userEmail} size={36} />
        </Avatar>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-foreground">
            {userName}
          </span>
          <div className="flex items-center gap-2">
            {userHandle && (
              <span className="text-sm text-text-secondary">@{userHandle}</span>
            )}
            {userHandle && (
              <span className="text-sm text-text-tertiary">&middot;</span>
            )}
            <span className="text-sm text-text-tertiary">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Username edit — keyed by handle so it remounts cleanly on save */}
      <UsernameForm
        key={userHandle ?? '__no-handle__'}
        currentHandle={userHandle || ''}
      />
    </>
  );
}

// Separate component keyed by currentHandle — remounts on handle change,
// eliminating all useEffect sync patterns (Rules 1 & 5 of no-useEffect).
function UsernameForm({ currentHandle }: { currentHandle: string }) {
  const queryClient = useQueryClient();
  const tour = useOptionalTour();
  const [isEditing, setIsEditing] = useState(!currentHandle);
  const [debouncedHandle, setDebouncedHandle] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-enter edit mode when the tour highlights the username input
  const tourOnUsername =
    tour?.isActive &&
    tour.activeTourId === 'claim-username' &&
    tour.currentStep?.id === 'username-input';
  if (tourOnUsername && !isEditing) {
    setIsEditing(true);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SetHandleForm>({
    resolver: zodResolver(setHandleSchema),
    defaultValues: { handle: currentHandle },
  });

  const handleValue = watch('handle');

  // Derived state — no useEffect needed (Rule 1)
  const trimmed = handleValue?.trim().toLowerCase() || '';
  const hasChanged = trimmed !== currentHandle.toLowerCase();
  const isSameAsCurrent = debouncedHandle === currentHandle.toLowerCase();

  // Debounce via onChange handler (Rule 3 — event handler, not effect)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Let react-hook-form handle the value update via register
    register('handle').onChange(e);

    const val = e.target.value.trim().toLowerCase();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length >= 3 && /^[a-z0-9_-]+$/.test(val)) {
      debounceRef.current = setTimeout(() => setDebouncedHandle(val), 300);
    } else {
      setDebouncedHandle('');
    }
  };

  const availabilityQuery = useQuery({
    ...trpc.user.checkHandleAvailability.queryOptions({
      handle: debouncedHandle,
    }),
    enabled: !!debouncedHandle && !isSameAsCurrent,
    staleTime: 10_000,
  });

  const isAvailable = availabilityQuery.data?.available;
  const isChecking = availabilityQuery.isLoading && !!debouncedHandle;

  const saveMutation = useMutation({
    mutationFn: (data: SetHandleForm) =>
      trpcClient.user.setHandle.mutate({ handle: data.handle }),
    onSuccess: () => {
      toast.success('Username saved');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [['user', 'getMe']] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save username');
    },
  });

  const onSubmit = (data: SetHandleForm) => {
    saveMutation.mutate(data);
  };

  const handleCancel = () => {
    reset({ handle: currentHandle });
    setDebouncedHandle('');
    setIsEditing(false);
  };

  const firstError = getFirstError(errors);

  // Merge register with custom onChange for debouncing
  const { onChange: rhfOnChange, ...registerRest } = register('handle');

  return (
    <SettingsSection>
      <SectionTitle>Username</SectionTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1" data-tour-step-id="username-input">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/40 pointer-events-none z-10">
              @
            </span>
            <Input
              {...registerRest}
              onChange={handleInputChange}
              placeholder="Set your username"
              className={cn(
                'pl-7 font-mono text-sm',
                !isEditing && 'pointer-events-none !shadow-none !ring-0'
              )}
              aria-invalid={isEditing ? !!errors.handle : undefined}
              readOnly={!isEditing}
              tabIndex={isEditing ? undefined : -1}
            />
          </div>
          {isEditing ? (
            <div className="flex gap-2" data-tour-step-id="username-save">
              {currentHandle && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  saveMutation.isPending ||
                  (!isSameAsCurrent && isAvailable === false)
                }
                variant="default"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Validation / availability feedback — only in edit mode */}
        {isEditing && firstError && (
          <p className="text-sm text-red-500">{firstError}</p>
        )}
        {isEditing && !firstError && debouncedHandle && !isSameAsCurrent && (
          <p
            className={cn(
              'text-sm',
              isChecking
                ? 'text-text-tertiary'
                : isAvailable
                  ? 'text-green-500'
                  : 'text-red-500'
            )}
          >
            {isChecking
              ? 'Checking...'
              : isAvailable
                ? 'Available'
                : 'Already taken'}
          </p>
        )}
      </form>
    </SettingsSection>
  );
}
// Linked accounts section
function LinkedAccountsSection() {
  const queryClient = useQueryClient();
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  // Use tRPC to fetch linked accounts
  const { data: accountsData } = useQuery(
    trpc.user.getLinkedAccounts.queryOptions()
  );

  const hasGitHub = accountsData?.accounts?.some(
    (a: { providerId: string }) => a.providerId === 'github'
  );
  const hasGoogle = accountsData?.accounts?.some(
    (a: { providerId: string }) => a.providerId === 'google'
  );
  const hasEmail = accountsData?.accounts?.some(
    (a: { providerId: string }) => a.providerId === 'email'
  );

  // Count total OAuth providers (excluding email)
  const oauthCount = (hasGitHub ? 1 : 0) + (hasGoogle ? 1 : 0);

  const handleLinkProvider = async (provider: 'github' | 'google') => {
    // Prevent double-clicks
    if (isLinking !== null || isUnlinking !== null) {
      return;
    }

    setIsLinking(provider);
    try {
      // Use Better Auth's built-in linkSocial method with error handling
      await authClient.linkSocial(
        {
          provider,
          callbackURL: '/settings/account',
        },
        {
          onError: (ctx) => {
            const errorMessage =
              ctx.error?.message ||
              `Failed to link ${provider === 'github' ? 'GitHub' : 'Google'}`;
            toast.error(errorMessage);
            setIsLinking(null);
          },
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to link ${provider === 'github' ? 'GitHub' : 'Google'}`;
      toast.error(errorMessage);
      setIsLinking(null);
    }
  };

  const handleUnlinkProvider = async (provider: 'github' | 'google') => {
    // Don't allow unlinking if it's the only OAuth provider
    // Users must have at least one social connection (GitHub or Google)
    if (oauthCount <= 1) {
      toast.error(
        'You must have at least one social connection (GitHub or Google) to access your account'
      );
      return;
    }

    setIsUnlinking(provider);
    try {
      // Use Better Auth's built-in unlinkAccount method with error handling
      await authClient.unlinkAccount(
        {
          providerId: provider,
        },
        {
          onSuccess: () => {
            toast.success(
              `${provider === 'github' ? 'GitHub' : 'Google'} unlinked`
            );
            // Refetch accounts
            queryClient.invalidateQueries({
              queryKey: trpc.user.getLinkedAccounts.queryKey(),
            });
          },
          onError: (ctx) => {
            const errorMessage =
              ctx.error?.message ||
              `Failed to unlink ${provider === 'github' ? 'GitHub' : 'Google'}`;
            toast.error(errorMessage);
          },
        }
      );
      setIsUnlinking(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to unlink ${provider === 'github' ? 'GitHub' : 'Google'}`;
      toast.error(errorMessage);
      setIsUnlinking(null);
    }
  };

  return (
    <SettingsSection>
      <SectionTitle>Linked accounts</SectionTitle>
      <p className="text-sm text-text-secondary">
        Link your GitHub and Google accounts for easier sign-in. You can use
        either to sign in.
      </p>

      <div className="flex flex-col gap-3 mt-2">
        {/* GitHub */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-2">
          <div className="flex items-center gap-3">
            <GithubIcon className="h-5 w-5 fill-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                GitHub
              </span>
              {hasGitHub && (
                <span className="text-xs text-text-tertiary">Connected</span>
              )}
            </div>
          </div>
          {hasGitHub ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlinkProvider('github')}
              disabled={isUnlinking !== null || isLinking !== null}
            >
              {isUnlinking === 'github' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Unlink className="size-4" />
                  Unlink
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleLinkProvider('github')}
              disabled={isLinking !== null}
            >
              {isLinking === 'github' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <LinkIcon className="size-4" />
                  Link
                </>
              )}
            </Button>
          )}
        </div>

        {/* Google */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-2">
          <div className="flex items-center gap-3">
            <GoogleIcon className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Google
              </span>
              {hasGoogle && (
                <span className="text-xs text-text-tertiary">Connected</span>
              )}
            </div>
          </div>
          {hasGoogle ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlinkProvider('google')}
              disabled={isUnlinking !== null || isLinking !== null}
            >
              {isUnlinking === 'google' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Unlink className="size-4" />
                  Unlink
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleLinkProvider('google')}
              disabled={isLinking !== null}
            >
              {isLinking === 'google' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <LinkIcon className="size-4" />
                  Link
                </>
              )}
            </Button>
          )}
        </div>

        {/* Email (read-only) */}
        {hasEmail && (
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-2 opacity-60">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-surface-3 flex items-center justify-center">
                <span className="text-xs">@</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Email
                </span>
                <span className="text-xs text-text-tertiary">
                  Password sign-in (deprecated)
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Legacy
            </Badge>
          </div>
        )}
      </div>

      {hasEmail && !hasGitHub && !hasGoogle && (
        <p className="text-xs text-amber-500 mt-2">
          ⚠️ Password sign-in is deprecated. Please link a GitHub or Google
          account.
        </p>
      )}
    </SettingsSection>
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
            sizes="48px"
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
  const isProfilePrivate = userData?.isProfilePrivate ?? false;
  const [optimisticPrivate, setOptimisticPrivate] = useState<boolean | null>(
    null
  );
  const displayPrivate = optimisticPrivate ?? isProfilePrivate;

  const updateProfilePrivacyMutation = useMutation(
    trpc.user.updateProfilePrivacy.mutationOptions({
      onSuccess: () => {
        setOptimisticPrivate(null);
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

  const handlePrivacyToggle = useCallback(
    async (value: boolean) => {
      setOptimisticPrivate(value);
      try {
        await updateProfilePrivacyMutation.mutateAsync({
          isProfilePrivate: value,
        });
        toast.success(`Profile is now ${value ? 'private' : 'public'}`);
      } catch {
        setOptimisticPrivate(null);
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
          checked={displayPrivate}
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
      <UserProfileSection />
      <LinkedAccountsSection />
      <PrivacySection />
      <AppearanceSection />
      <AccountActionsSection />
    </div>
  );
}
