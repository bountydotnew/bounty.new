'use client';
import Link from '@bounty/ui/components/link';
import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Spinner } from '@bounty/ui/components/spinner';
import { Input } from '@bounty/ui/components/input';
import { Logo } from '@/components/landing/logo';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  inviteCodeSchema,
  type InviteCodeForm,
  inviteCodeDefaults,
} from '@bounty/ui/lib/forms';
import { getFirstError } from '@bounty/ui/lib/form-errors';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';

export default function EarlyAccessRequiredPage() {
  const [checking, setChecking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteCodeForm>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: inviteCodeDefaults,
  });

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const { data } = await authClient.getSession({
        query: { disableCookieCache: true },
      });
      const role = data?.user?.role ?? 'user';
      if (role === 'early_access' || role === 'admin') {
        window.location.href = '/dashboard';
      }
      setChecking(false);
    } catch {
      setChecking(false);
    }
  };

  const onSubmitCode = async (data: InviteCodeForm) => {
    setRedeeming(true);
    setServerError(null);
    try {
      await trpcClient.earlyAccess.redeemInviteCode.mutate({
        code: data.code,
      });
      toast.success('Access granted!');
      await authClient.getSession({ query: { disableCookieCache: true } });
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired invite code';
      setServerError(message);
      setRedeeming(false);
    }
  };

  const firstError = getFirstError(errors);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12 sm:px-8">
          <div className="w-full max-w-md text-center">
            {/* Logo */}
            <div className="mb-10 flex justify-center">
              <Logo className="h-16 w-16 text-foreground" />
            </div>

            {/* Heading */}
            <h1 className="mb-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Early Access Required
            </h1>

            {/* Description */}
            <p className="mb-10 text-base leading-relaxed text-text-muted sm:text-lg">
              We&apos;re gradually rolling out access to bounty.new. Join the
              waitlist to be among the first to use Bounty!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={handleCheckStatus}
                disabled={checking}
                variant="default"
              >
                {checking ? (
                  <>
                    <Spinner className="h-4 w-4" size="sm" />
                    Checking...
                  </>
                ) : (
                  'Check Status'
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back Home</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-text-muted">
              Already joined the waitlist? Click &quot;Check Status&quot; to see
              if you have access.
            </p>

            {/* Invite code section */}
            <div className="mt-10 border-t border-border-subtle pt-8">
              <p className="mb-4 text-sm font-medium text-foreground">
                Have an invite code?
              </p>
              <form
                onSubmit={handleSubmit(onSubmitCode)}
                className="flex gap-2"
              >
                <Input
                  {...register('code')}
                  placeholder="BTY0000"
                  className="flex-1 text-center font-mono uppercase"
                  aria-invalid={!!errors.code}
                />
                <Button type="submit" disabled={redeeming} variant="default">
                  {redeeming ? (
                    <>
                      <Spinner className="h-4 w-4" size="sm" />
                      Verifying...
                    </>
                  ) : (
                    'Redeem'
                  )}
                </Button>
              </form>
              {(firstError || serverError) && (
                <p className="mt-2 text-sm text-red-500">
                  {firstError || serverError}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
