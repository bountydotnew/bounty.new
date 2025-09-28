'use client';

import { Button } from '@bounty/ui/components/button';
import Link from '@bounty/ui/components/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Bounty from '@/components/icons/bounty';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.message || 'Email verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-[#111110] text-[#f3f3f3]">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
            <Bounty className="h-12 w-12 text-primary" />
          </div>

          <div className="space-y-4">
            {status === 'loading' && (
              <>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <h1 className="text-xl font-medium">Verifying your email...</h1>
                <p className="text-gray-400">Please wait while we verify your email address.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h1 className="text-xl font-medium">Email Verified!</h1>
                <p className="text-gray-400">{message}</p>
                <div className="space-y-3 pt-4">
                  <Button
                    asChild
                    className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/login">Sign in to your account</Link>
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-16 w-16 text-red-500" />
                <h1 className="text-xl font-medium">Verification Failed</h1>
                <p className="text-gray-400">{message}</p>
                <div className="space-y-3 pt-4">
                  <Button
                    asChild
                    className="w-full rounded-lg bg-[#2A2A28] py-3 font-medium text-gray-200 hover:bg-[#383838]"
                  >
                    <Link href="/login">Back to Sign In</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}