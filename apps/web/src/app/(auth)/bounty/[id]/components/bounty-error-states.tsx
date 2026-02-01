'use client';

import { Button } from '@bounty/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Bounty from '@/components/icons/bounty';

interface BountyErrorStateProps {
  title: string;
  message: string;
}

export function BountyErrorState({ title, message }: BountyErrorStateProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-lg px-6 py-5 text-center">
        <Bounty className="mx-auto mb-10 h-10 w-10" />
        <h1 className="font-semibold text-foreground text-xl">{title}</h1>
        <p className="mt-1 text-neutral-400 text-sm">{message}</p>
        <Button
          className="mt-6"
          onClick={() => router.push('/dashboard')}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Take me home
        </Button>
      </div>
    </div>
  );
}

export function InvalidIdState() {
  return (
    <BountyErrorState
      title="You got us scratching our heads... 😅"
      message="Either you typed out the entire url and still got it wrong, someone is trolling you, or you arrived too late!"
    />
  );
}

export function LoadingState() {
  return (
    <BountyErrorState
      title="Loading bounty..."
      message="Please wait while we fetch the bounty details."
    />
  );
}

export function NotFoundState() {
  return (
    <BountyErrorState
      title="Bounty not found"
      message="It may have been removed or never existed."
    />
  );
}

export function ErrorState() {
  return (
    <BountyErrorState
      title="Couldn't load bounty"
      message="Please try again in a moment."
    />
  );
}
