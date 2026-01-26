import { db, userProfile, userReputation } from '@bounty/db';
import type { Metadata } from 'next';
import { baseUrl } from '@bounty/ui/lib/constants';
import { eq } from 'drizzle-orm';
import ProfilePageClient from './page.client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ user: string }>;
}): Promise<Metadata> {
  const { user: handle } = await params;

  // Fetch user by handle
  const profileUser = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.handle, handle.toLowerCase()),
    columns: {
      id: true,
      name: true,
      handle: true,
    },
  });

  if (!profileUser) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    };
  }

  // Fetch profile and reputation separately
  const [profileData, reputationData] = await Promise.all([
    db.query.userProfile.findFirst({
      where: eq(userProfile.userId, profileUser.id),
      columns: { bio: true },
    }),
    db.query.userReputation.findFirst({
      where: eq(userReputation.userId, profileUser.id),
      columns: { bountiesCompleted: true, totalEarned: true },
    }),
  ]);

  const displayName = profileUser.name || profileUser.handle || 'User';
  const bio = profileData?.bio;
  const bountiesCompleted = reputationData?.bountiesCompleted ?? 0;
  const totalEarned = reputationData?.totalEarned
    ? Number(reputationData.totalEarned).toLocaleString()
    : null;

  // Build a personalized description
  let description = `View ${displayName}'s profile on bounty.new`;
  if (bio) {
    description = `${bio} — ${displayName}'s profile on bounty.new`;
  }
  if (bountiesCompleted > 0) {
    const earnings = totalEarned ? ` • earned $${totalEarned}` : '';
    description += ` • ${bountiesCompleted} bounty${bountiesCompleted === 1 ? '' : 'ies'} completed${earnings}`;
  }

  const ogImageUrl = `${baseUrl}/api/og-image/profile/${profileUser.handle}`;

  return {
    title: `@${profileUser.handle} - ${displayName}`,
    description,
    openGraph: {
      title: `@${profileUser.handle} - ${displayName}`,
      description,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${displayName}'s profile on Bounty`,
            },
          ]
        : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${profileUser.handle} - ${displayName}`,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default function ProfilePage() {
  return <ProfilePageClient />;
}
