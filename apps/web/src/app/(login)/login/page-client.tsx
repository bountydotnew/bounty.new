'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { useQueryState, parseAsString } from 'nuqs';
import { Suspense, useEffect, useRef } from 'react';
import LoginPageClient from '@/components/login/login.page.client';
import { useMutation } from 'convex/react';
import { api } from '@/utils/convex';

function LoginContent() {
  const [token] = useQueryState('invite', parseAsString);

  // Apply invite token via useMutation — fires once per token
  const appliedTokenRef = useRef<string | null>(null);
  const applyInvite = useMutation(api.functions.user.applyInvite);

  useEffect(() => {
    if (token && appliedTokenRef.current !== token) {
      appliedTokenRef.current = token;
      applyInvite({ token });
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <LoginPageClient />;
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
