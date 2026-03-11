import { auth } from '@bounty/auth/server';
import { db } from '@bounty/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/');
  }

  // Look up the user's handle from the database
  const userData = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.id, session.user.id),
    columns: { id: true, handle: true },
  });

  if (userData?.handle) {
    redirect(`/profile/${userData.handle}`);
  } else if (userData?.id) {
    redirect(`/profile/${userData.id}`);
  }

  // Fallback: redirect to root if user not found
  redirect('/');
}
