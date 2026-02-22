'use client';

import { Button } from '@bounty/ui/components/button';
import Link from '@bounty/ui/components/link';
import Bounty from '@/components/icons/bounty';

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
            <Bounty className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-4">
            <h1 className="font-medium text-xl">Check your email</h1>
            <p className="text-gray-400">
              We sent a verification link to your inbox. Open it to verify your
              email.
            </p>
            <div className="space-y-3 pt-4">
              <Button
                asChild
                className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
