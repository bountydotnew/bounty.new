'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect_url') ?? '/login';

  const handleSignUpSuccess = useCallback(
    (email: string) => {
      const usp = new URLSearchParams();
      usp.set('email', email);
      if (redirect) {
        usp.set('redirect_url', redirect);
      }
      router.push(`/sign-up/verify-email-address?${usp.toString()}`);
    },
    [router, redirect],
  );

  // Render only the sign-up form; navigation to /login is via links inside the form.
  return (
    <div className="mx-auto w-full bg-landing-background">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AuthForm mode="signup" onModeChange={() => null} onSignUpSuccess={handleSignUpSuccess} />
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}