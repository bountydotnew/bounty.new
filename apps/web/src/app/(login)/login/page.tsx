'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Login from '@/components/bounty/login';
import { trpc } from '@/utils/trpc';

function LoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('invite');
  const applyInvite = useMutation({
    ...trpc.user.applyInvite.mutationOptions(),
  });
  useEffect(() => {
    if (token) {
      applyInvite.mutate({ token });
    }
  }, [token, applyInvite]);

  // Note: Authentication logic has been moved to the Login component
  // with proper security measures to prevent open redirect vulnerabilities

  return <Login />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full bg-landing-background">
      {/* <Header /> */}
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
