'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OrgInvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invitationId = params.id as string;

  useEffect(() => {
    let cancelled = false;

    const acceptInvitation = async () => {
      if (!invitationId) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const result = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (cancelled) return;

        if (result.error) {
          console.error('Failed to accept invitation:', result.error);
          setError(result.error.message ?? 'Failed to accept invitation');
          toast.error(result.error.message ?? 'Failed to accept invitation');
        } else {
          toast.success('Invitation accepted! Welcome to the team.');
          // Redirect to the new org's integrations page
          const orgId = result.data?.invitation?.organizationId;
          if (orgId) {
            // Fetch org slug for redirect
            const orgs = await authClient.organization.list();
            if (cancelled) return;
            const org = orgs.data?.find((o: { id: string }) => o.id === orgId);
            if (org?.slug) {
              router.push(`/${org.slug}/integrations`);
            } else {
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error accepting invitation:', err);
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    acceptInvitation();
    return () => { cancelled = true; };
  }, [invitationId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-foreground mx-auto mb-4" />
          <h1 className="text-lg font-medium text-foreground">
            Accepting invitation...
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Please wait while we add you to the team
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Invitation Error
          </h1>
          <p className="text-text-muted mb-6">{error}</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-foreground mx-auto mb-4" />
        <h1 className="text-lg font-medium text-foreground">Redirecting...</h1>
      </div>
    </div>
  );
}
