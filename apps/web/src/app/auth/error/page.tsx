'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@bounty/ui/components/button';
import Bounty from '@/components/icons/bounty';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
    banned: {
        title: 'Account Suspended',
        description: 'Your account has been suspended. Please contact support for assistance.',
    },
    verification_failed: {
        title: 'Verification Failed',
        description: 'We could not verify your account. Please try signing in again.',
    },
    oauth_error: {
        title: 'Authentication Error',
        description: 'There was an issue with the authentication provider. Please try again.',
    },
    invalid_credentials: {
        title: 'Invalid Credentials',
        description: 'The credentials you provided are invalid. Please check and try again.',
    },
    session_expired: {
        title: 'Session Expired',
        description: 'Your session has expired. Please sign in again.',
    },
    rate_limited: {
        title: 'Too Many Attempts',
        description: 'Too many login attempts. Please wait a moment and try again.',
    },
    default: {
        title: 'Authentication Error',
        description: 'An unexpected error occurred during authentication. Please try again.',
    },
};

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error') || 'default';
    const message = ERROR_MESSAGES[error] || ERROR_MESSAGES.default;

    const handleRetry = () => {
        window.location.href = '/login';
    };

    const handleHome = () => {
        window.location.href = '/';
    };

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center text-white p-4"
            style={{
                background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
            }}
        >
            <div className="w-full max-w-md space-y-8">
                {/* Error Content */}
                <div className="overflow-x-hidden rounded-md p-6">
                    <div className="text-center space-y-6">

                        <Link href="/" className="inline-block">
                            <Bounty className="mx-auto h-12 w-12 text-white" />
                        </Link>

                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold" style={{ color: 'rgba(239, 239, 239, 1)' }}>
                                {message.title}
                            </h1>
                            <p className="text-sm" style={{ color: 'rgba(146, 146, 146, 1)' }}>
                                {message.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs" style={{ color: 'rgba(146, 146, 146, 0.7)' }}>
                               If this problem persists, please contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
