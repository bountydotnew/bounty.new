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

  let email: string;
  try {
    const entry = await db.query.waitlist.findFirst({
      where: (fields, { eq }) => eq(fields.id, entryId),
    });

    if (!entry || !entry.email) {
      redirect('/');
    }
    email = entry.email;
  } catch (error) {
    redirect('/');
  }

  return <VerifyEmailClient entryId={entryId} email={email} />;
}
