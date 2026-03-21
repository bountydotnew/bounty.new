'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@bounty/auth/client';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import { Spinner } from '@bounty/ui/components/spinner';
import { Button } from '@bounty/ui/components/button';
import { Logo } from '@/components/landing/logo';
import Link from 'next/link';

type RedeemState = 'checking' | 'not-logged-in' | 'redeeming' | 'success' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [state, setState] = useState<RedeemState>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAndRedeem() {
      try {
        // Check if user is logged in (fresh session, no cache)
        const { data: session } = await authClient.getSession({
          query: { disableCookieCache: true },
        });

        if (!session?.user) {
          setState('not-logged-in');
          return;
        }

        // Check if user already has access
        const role = session.user.role ?? 'user';
        if (role === 'early_access' || role === 'admin') {
          // Already has access - go straight to dashboard
          router.push('/dashboard');
          return;
        }

        // User is logged in but needs access - try to redeem
        setState('redeeming');

        await trpcClient.earlyAccess.redeemInviteCode.mutate({ code });

        // Refresh session to get updated role
        await authClient.getSession({ query: { disableCookieCache: true } });

        setState('success');
        toast.success('Welcome to bounty.new!');

        // Redirect to dashboard after a moment
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (err) {
        setState('error');
        const message = err instanceof Error ? err.message : 'Invalid or expired invite code';
        setError(message);
      }
    }

    checkAndRedeem();
  }, [code, router]);

  const handleSignIn = () => {
    // Redirect to sign in with callback to this invite page
    const callbackUrl = `/invite/${code}`;
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo className="h-12 w-12 text-foreground" />
        </div>

        {state === 'checking' && (
          <>
            <Spinner className="mx-auto mb-4 h-8 w-8" />
            <p className="text-text-muted">Checking invite...</p>
          </>
        )}

        {state === 'not-logged-in' && (
          <>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              Sign in to accept invite
            </h1>
            <p className="mb-6 text-text-muted">
              You need to sign in to accept this invite and get early access.
            </p>
            <Button onClick={handleSignIn} size="lg">
              Sign in to continue
            </Button>
          </>
        )}

        {state === 'redeeming' && (
          <>
            <Spinner className="mx-auto mb-4 h-8 w-8" />
            <p className="text-text-muted">Activating your access...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              You're in!
            </h1>
            <p className="text-text-muted">Redirecting to dashboard...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="mb-4 text-2xl font-semibold text-foreground">
              Invite Error
            </h1>
            <p className="mb-6 text-destructive">{error}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="outline">
                <Link href="/early-access-required">Try another code</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
