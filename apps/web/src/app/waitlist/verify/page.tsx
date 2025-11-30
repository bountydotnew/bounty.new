import { redirect } from 'next/navigation';
import { db } from '@bounty/db';
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
    // Query database directly to avoid exposing email in URL/logs
    const entry = await db.query.waitlist.findFirst({
      where: (fields, { eq }) => eq(fields.id, entryId),
    });

    if (!entry || !entry.email) {
      redirect('/');
    }
    email = entry.email;
  } catch (error) {
    // If entry not found or error, redirect to home
    redirect('/');
  }

  return <VerifyEmailClient entryId={entryId} email={email} />;
}
