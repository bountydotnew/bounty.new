"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { useProfileData, type ProfileData } from "./hooks/use-profile-data";
import {
	ProfileLoadingState,
	ProfileNotFoundState,
	PrivateProfileMessage,
} from "./components/profile-states";
import { trpc } from "@/utils/trpc";

interface ProfilePageClientProps {
	initialData?: ProfileData | null;
}

export default function ProfilePageClient({
	initialData,
}: ProfilePageClientProps) {
	const params = useParams();
	const handleOrUserId = params.userId as string;
	const queryClient = useQueryClient();

	const { data, isLoading, isError } = useProfileData({
		handle: handleOrUserId,
		enabled: !!handleOrUserId,
		initialData: initialData ?? undefined,
	});

	// Prefetch all tab data in parallel to flatten waterfall
	useEffect(() => {
		if (data?.user?.id && !data.isPrivate) {
			const userId = data.user.id;
			// Prefetch bounties, activity, and highlights in parallel
			queryClient.prefetchQuery(
				trpc.bounties.getBountiesByUserId.queryOptions({ userId }),
			);
			queryClient.prefetchQuery(
				trpc.user.getUserActivity.queryOptions({ userId }),
			);
			queryClient.prefetchQuery(
				trpc.bounties.getHighlights.queryOptions({ userId }),
			);
		}
	}, [data?.user?.id, data?.isPrivate, queryClient]);

	// Loading state (skip if we have initialData)
	if (isLoading && !initialData) {
		return <ProfileLoadingState />;
	}

	// Error or not found state
	if (isError || !data || !data.user) {
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
						email: user.email ?? "",
						image: user.image ?? "",
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
