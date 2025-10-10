'use client';

import { Button } from '@bounty/ui/components/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function validateRedirectUrl(url: string | null): string {
  if (!url) {
    return '/';
  }

  try {
    // URL decode the value
    const decodedUrl = decodeURIComponent(url);

    // Reject URLs with schemes or hosts
    if (decodedUrl.includes('://') || decodedUrl.startsWith('//')) {
      return '/';
    }

    // Parse as URL to check origin (this will throw for relative URLs)
    try {
      const parsedUrl = new URL(decodedUrl, window.location.origin);
      // Reject if origin differs from current origin
      if (parsedUrl.origin !== window.location.origin) {
        return '/';
      }
    } catch {
      // If it's not a valid absolute URL, treat as relative path
    }

    // Only allow paths that start with single "/" and not "//"
    if (!decodedUrl.startsWith('/') || decodedUrl.startsWith('//')) {
      return '/';
    }

    // Whitelist of allowed routes (can be extended)
    const allowedRoutes = ['/dashboard', '/login', '/profile', '/bounties'];
    const pathOnly = decodedUrl.split('?')[0]; // Remove query params for checking

    // Allow exact matches or sub-paths of whitelisted routes
    const isAllowed = allowedRoutes.some(route =>
      pathOnly === route || pathOnly.startsWith(route + '/')
    );

    if (!isAllowed && pathOnly !== '/') {
      return '/';
    }

    return decodedUrl;
  } catch {
    // If any error occurs during validation, use safe default
    return '/';
  }
}

export default function VerifyEmailAddressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

  const email = searchParams.get('email');
  const code = searchParams.get('code');
  const rawRedirectUrl = searchParams.get('redirectUrl') || searchParams.get('redirect_url');

  // Validate and normalize the redirect URL
  const redirectUrl = validateRedirectUrl(rawRedirectUrl);

  useEffect(() => {
    if (code && email) {
      handleVerifyEmail();
    }
  }, [code, email]);

  const handleVerifyEmail = async () => {
    if (!code || !email) {
      toast.error('Missing verification code or email');
      return;
    }

    try {
      setIsVerifying(true);

      // TODO: Replace with actual email verification API call
      // const response = await authClient.verifyEmail({ email, code });

      // Mock verification for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Email verified successfully!');

      // Use the validated redirect URL
      router.push(redirectUrl);
    } catch (error) {
      toast.error('Failed to verify email. Please try again.');
      console.error('Email verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111110]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-white">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111110]">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Verify Email Address</h1>
          <p className="mt-2 text-gray-400">
            Please click the link in your email to verify your account.
          </p>
        </div>

        {email && (
          <div className="rounded-lg bg-[#1D1D1D] p-4">
            <p className="text-sm text-gray-300">
              Verification email sent to: <strong>{email}</strong>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push(redirectUrl)}
            variant="outline"
          >
            Continue
          </Button>

          <Button
            className="w-full"
            onClick={() => router.push('/login')}
            variant="text"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}