'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DiscordLinkPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      setMessage('Your Discord account has been successfully linked to bounty.new!');
    } else if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(error));
    } else {
      setStatus('loading');
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-[#232323] bg-[#191919] p-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-center text-[#929292]">Processing Discord account link...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Success!</h1>
            <p className="text-center text-[#929292]">{message}</p>
            <p className="text-center text-sm text-[#5A5A5A]">
              You can now use Discord bot commands that require authentication.
            </p>
            <div className="flex w-full flex-col gap-2 pt-4">
              <Link
                href="/dashboard"
                className="w-full rounded-lg bg-white px-4 py-2 text-center font-medium text-black transition-colors hover:bg-gray-200"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/settings/profile"
                className="w-full rounded-lg border border-[#232323] px-4 py-2 text-center font-medium text-white transition-colors hover:bg-[#232323]"
              >
                View Profile Settings
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Error</h1>
            <p className="text-center text-[#929292]">{message}</p>
            <div className="flex w-full flex-col gap-2 pt-4">
              <Link
                href="/settings/profile"
                className="w-full rounded-lg bg-white px-4 py-2 text-center font-medium text-black transition-colors hover:bg-gray-200"
              >
                Try Again
              </Link>
              <Link
                href="/dashboard"
                className="w-full rounded-lg border border-[#232323] px-4 py-2 text-center font-medium text-white transition-colors hover:bg-[#232323]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
