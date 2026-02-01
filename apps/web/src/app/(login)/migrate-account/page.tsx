'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Spinner } from '@bounty/ui/components/spinner';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Bounty from '@/components/icons/bounty';
import { GithubIcon } from '@/components/icons';
import GoogleIcon from '@/components/icons/google';
import { AlertCircle } from 'lucide-react';

function MigrateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  // Check if user needs migration (has password auth but no OAuth)
  useEffect(() => {
    const checkMigrationStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-migration');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
          }
          return;
        }

        const data = await response.json();

        if (data.hasOAuth) {
          // User already has OAuth linked, redirect to dashboard
          router.push(searchParams.get('redirect') || '/dashboard');
        } else {
          // User needs to migrate
          setNeedsMigration(true);
        }
      } catch {
        // Error checking status, redirect to login
        router.push('/login');
      } finally {
        setHasChecked(true);
      }
    };

    checkMigrationStatus();
  }, [router, searchParams]);

  const handleGitHubLink = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL: searchParams.get('redirect') || '/dashboard',
        }
      );
    } catch {
      toast.error('Failed to link GitHub');
      setIsPending(false);
    }
  };

  const handleGoogleLink = async () => {
    setIsPending(true);
    try {
      await authClient.signIn.social(
        {
          provider: 'google',
          callbackURL: searchParams.get('redirect') || '/dashboard',
        }
      );
    } catch {
      toast.error('Failed to link Google');
      setIsPending(false);
    }
  };

  if (!hasChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!needsMigration) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg">
            <Bounty className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-medium text-amber-200">Password sign-in is deprecated</h3>
            <p className="text-sm text-amber-200/70">
              Please link a GitHub or Google account to continue using your account. This will be required for future sign-ins.
            </p>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-4">
          <Button
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-hover py-3 font-medium text-gray-200 transition-colors hover:bg-surface-3"
            onClick={handleGitHubLink}
            disabled={isPending}
          >
            <GithubIcon className="h-5 w-5 fill-background" />
            {isPending ? 'Linking...' : 'Link GitHub account'}
          </Button>

          <Button
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-3 font-medium text-gray-900 transition-colors hover:bg-gray-100"
            onClick={handleGoogleLink}
            disabled={isPending}
          >
            <GoogleIcon className="h-5 w-5" />
            {isPending ? 'Linking...' : 'Link Google account'}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-400">
          Your account data will be preserved after linking.
        </p>
      </div>
    </div>
  );
}

export default function MigrateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <MigrateAccountContent />
    </Suspense>
  );
}
