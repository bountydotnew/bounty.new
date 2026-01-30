'use client';

import { Lock } from 'lucide-react';
import { Spinner } from '@bounty/ui';

export function ProfileLoadingState() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </div>
  );
}

export function ProfileNotFoundState() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">User not found</h1>
      <p className="text-text-tertiary">
        The user you are looking for does not exist.
      </p>
    </div>
  );
}

interface PrivateProfileMessageProps {
  handle: string | null;
  fallbackHandle: string;
}

export function PrivateProfileMessage({
  handle,
  fallbackHandle,
}: PrivateProfileMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full">
        <Lock className="h-8 w-8 text-text-tertiary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">
        This profile is private
      </h2>
      <p className="text-center text-text-tertiary">
        @{handle || fallbackHandle} has set their profile to private.
      </p>
    </div>
  );
}
