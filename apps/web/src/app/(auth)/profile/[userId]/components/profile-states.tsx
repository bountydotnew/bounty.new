"use client";

import { Lock } from "lucide-react";

export function ProfileLoadingState() {
	return (
		<div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12 animate-pulse">
			<div className="flex flex-col gap-8">
				{/* Header skeleton */}
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
						<div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
							{/* Avatar */}
							<div className="h-24 w-24 rounded-xl bg-white/5 md:h-32 md:w-32" />
							<div className="flex flex-col gap-2 pt-1">
								{/* Name */}
								<div className="h-8 w-48 rounded bg-white/5" />
								{/* Handle */}
								<div className="h-4 w-32 rounded bg-white/5" />
								{/* Bio */}
								<div className="h-4 w-64 rounded bg-white/5" />
								{/* Meta info */}
								<div className="flex gap-4 pt-1">
									<div className="h-4 w-28 rounded bg-white/5" />
									<div className="h-4 w-20 rounded bg-white/5" />
								</div>
							</div>
						</div>
					</div>
					{/* GitHub chart placeholder */}
					<div className="h-24 w-full rounded-xl bg-white/5" />
				</div>

				{/* Tabs skeleton */}
				<div className="flex gap-4 border-b border-border-subtle pb-2">
					<div className="h-8 w-20 rounded bg-white/5" />
					<div className="h-8 w-20 rounded bg-white/5" />
					<div className="h-8 w-20 rounded bg-white/5" />
				</div>

				{/* Content skeleton */}
				<div className="space-y-4">
					<div className="h-24 w-full rounded-xl bg-white/5" />
					<div className="h-24 w-full rounded-xl bg-white/5" />
					<div className="h-24 w-full rounded-xl bg-white/5" />
				</div>
			</div>
		</div>
	);
}

export function ProfileNotFoundState() {
	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
			<h1 className="text-2xl font-bold text-foreground">User not found</h1>
			<p className="text-text-tertiary">
				The user you are looking for does not exist.
			</p>
		</div>
	);
}

interface PrivateProfileMessageProps {
	handle: string | null;
	fallbackHandle: string;
}

export function PrivateProfileMessage({
	handle,
	fallbackHandle,
}: PrivateProfileMessageProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-xl p-12">
			<div className="flex h-16 w-16 items-center justify-center rounded-full">
				<Lock className="h-8 w-8 text-text-tertiary" />
			</div>
			<h2 className="text-xl font-semibold text-foreground">
				This profile is private
			</h2>
			<p className="text-center text-text-tertiary">
				@{handle || fallbackHandle} has set their profile to private.
			</p>
		</div>
	);
}
