'use client';

import { useParams } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs } from '@/components/profile/profile-tabs';
import { useProfileData } from './hooks/use-profile-data';
import {
  ProfileLoadingState,
  ProfileNotFoundState,
  PrivateProfileMessage,
} from './components/profile-states';

export default function ProfilePageClient() {
  const params = useParams();
  const handleOrUserId = params.userId as string;

  const { data, isLoading, isError } = useProfileData({
    handle: handleOrUserId,
    enabled: !!handleOrUserId,
  });

  // Loading state
  if (isLoading) {
    return <ProfileLoadingState />;
  }

  // Error or not found state
  if (isError || !data) {
    return <ProfileNotFoundState />;
  }

  const { user, profile, reputation, isPrivate } = data;

  // Prepare profile data for header
  const profileData = isPrivate
    ? null
    : {
        bio: profile?.bio ?? null,
        location: profile?.location ?? null,
        website: profile?.website ?? null,
        githubUsername: profile?.githubUsername ?? null,
        skills: profile?.skills ?? null,
      };

  // Prepare reputation data for header
  const reputationData = isPrivate
    ? null
    : {
        totalEarned: reputation?.totalEarned ?? null,
        bountiesCompleted: reputation?.bountiesCompleted ?? null,
        bountiesCreated: reputation?.bountiesCreated ?? null,
      };

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <ProfileHeader
          user={{
            ...user,
            createdAt: new Date(user.createdAt),
            email: user.email ?? '',
            image: user.image ?? '',
          }}
          profile={profileData}
          reputation={reputationData}
        />
        {isPrivate ? (
          <PrivateProfileMessage
            handle={user.handle ?? null}
            fallbackHandle={handleOrUserId}
          />
        ) : (
          <ProfileTabs userId={user.id} />
        )}
      </div>
    </div>
  );
}
