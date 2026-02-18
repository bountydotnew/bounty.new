'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { Suspense } from 'react';
import { SignUpSection } from '@/components/sign-up/sign-up-section';

export default function SignUpPage() {
  return (
    <div className="mx-auto w-full bg-landing-background">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <SignUpPageContent />
      </Suspense>
    </div>
  );
}

function SignUpPageContent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <SignUpSection />
    </div>
  );
}
