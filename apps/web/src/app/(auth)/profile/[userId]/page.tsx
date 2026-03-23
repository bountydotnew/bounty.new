import { cache } from 'react';
import type { Metadata } from 'next';
import { createServerCaller } from '@bounty/api/src/server-caller';
import ProfilePageClient from './page.client';
import type { ProfileData } from './hooks/use-profile-data';

const getProfileData = cache(async (handle: string) => {
  try {
    const caller = await createServerCaller();
    return await caller.profiles.getProfile({ handle });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  const profileResponse = await getProfileData(userId);

  if (!profileResponse) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    };
  }

  const profileUser = profileResponse.data.user;
  const displayName = profileUser.name || profileUser.handle || 'User';

  // OG images are automatically generated via opengraph-image.tsx and twitter-image.tsx
  return {
    title: `@${profileUser.handle || displayName} — bounty`,
    description: `View ${displayName}'s profile on bounty.new`,
    openGraph: {
      title: `@${profileUser.handle || displayName} — bounty`,
      description: `View ${displayName}'s profile on bounty.new`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${profileUser.handle || profileUser.id} - ${displayName}`,
      description: `View ${displayName}'s profile on bounty.new`,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const apiResponse = await getProfileData(userId);

  let initialData: ProfileData | null = null;
  let serverTabData: {
    bounties?: unknown;
    activity?: unknown;
    highlights?: unknown;
  } = {};

  if (apiResponse) {
    initialData = {
      user: {
        id: apiResponse.data.user.id,
        name: apiResponse.data.user.name,
        handle: apiResponse.data.user.handle ?? null,
        email: apiResponse.data.user.email ?? null,
        image: apiResponse.data.user.image,
        createdAt: String(apiResponse.data.user.createdAt),
        isProfilePrivate: apiResponse.data.user.isProfilePrivate ?? false,
      },
      profile: apiResponse.data.profile as ProfileData['profile'],
      reputation: apiResponse.data.reputation as ProfileData['reputation'],
      isPrivate: apiResponse.isPrivate ?? false,
    };

    // Prefetch tab data in parallel if profile is public
    if (!apiResponse.isPrivate) {
      const resolvedUserId = apiResponse.data.user.id;
      try {
        const caller = await createServerCaller();
        const [bounties, activity, highlights] = await Promise.allSettled([
          caller.bounties.getBountiesByUserId({ userId: resolvedUserId }),
          caller.user.getUserActivity({ userId: resolvedUserId }),
          caller.bounties.getHighlights({ userId: resolvedUserId }),
        ]);
        serverTabData = {
          bounties: bounties.status === 'fulfilled' ? bounties.value : undefined,
          activity: activity.status === 'fulfilled' ? activity.value : undefined,
          highlights: highlights.status === 'fulfilled' ? highlights.value : undefined,
        };
      } catch {
        // Tab prefetch is best-effort
      }
    }
  }

  return (
    <ProfilePageClient
      initialData={initialData}
      serverData={apiResponse}
      serverTabData={serverTabData}
    />
  );
}
