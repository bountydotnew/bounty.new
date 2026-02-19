"use client";

import { NotificationToast } from "./notification-toast";
import { Heart } from "lucide-react";
import type { ExternalToast } from "sonner";
import { toast as sonnerToast } from "sonner";

export type BountyLikedToastProps = {
	user: {
		name: string;
		image?: string | null;
	};
	timestamp: Date | string;
	onMarkAsRead?: () => void;
};

export function BountyLikedToast({
	user,
	timestamp,
	onMarkAsRead,
}: BountyLikedToastProps) {
	return (
		<NotificationToast
			id={0}
			user={user}
			message="Liked your bounty"
			timestamp={timestamp}
			actionIcon={<Heart className="size-2.5 fill-pink-500 text-pink-500" />}
			onDismiss={() => {}}
			onMarkAsRead={onMarkAsRead}
		/>
	);
}

export function showBountyLikedToast(
	props: BountyLikedToastProps,
	toastOptions?: ExternalToast,
) {
	return sonnerToast.custom(
		(id) => (
			<BountyLikedToast
				{...props}
				onMarkAsRead={() => {
					props.onMarkAsRead?.();
					sonnerToast.dismiss(id);
				}}
			/>
		),
		{
			duration: 5000,
			...toastOptions,
		},
	);
}
