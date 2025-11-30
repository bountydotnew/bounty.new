import { redirect } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { VerifyEmailClient } from './verify-client';

interface VerifyPageProps {
  searchParams: Promise<{ entryId?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const entryId = params.entryId;

  if (!entryId) {
    redirect('/');
  }

  // Fetch email server-side using entryId
  let email: string;
  try {
    const entry = await trpc.earlyAccess.getWaitlistEntry.query({ entryId });
    if (!entry.success || !entry.data?.email) {
      redirect('/');
    }
    email = entry.data.email;
  } catch (error) {
    // If entry not found or error, redirect to home
    redirect('/');
  }

  return <VerifyEmailClient entryId={entryId} email={email} />;
}
