"use client";

import { NotificationToast } from "./notification-toast";
import { CommentsIcon } from "../icons/huge/comments";
import type { ExternalToast } from "sonner";
import { toast as sonnerToast } from "sonner";

export type BountyCommentToastProps = {
	user: {
		name: string;
		image?: string | null;
	};
	timestamp: Date | string;
	isReply?: boolean;
	onMarkAsRead?: () => void;
};

export function BountyCommentToast({
	user,
	timestamp,
	isReply = false,
	onMarkAsRead,
}: BountyCommentToastProps) {
	const baseProps = {
		id: 0,
		user,
		message: isReply
			? "Replied to your comment"
			: "Left a comment on your bounty",
		timestamp,
		actionIcon: <CommentsIcon className="size-5 text-white" />,
		onDismiss: () => {},
	};

	const props = onMarkAsRead ? { ...baseProps, onMarkAsRead } : baseProps;

	return <NotificationToast {...props} />;
}

export function showBountyCommentToast(
	props: BountyCommentToastProps,
	toastOptions?: ExternalToast,
) {
	return sonnerToast.custom(
		(id) => (
			<BountyCommentToast
				{...props}
				onMarkAsRead={() => {
					props.onMarkAsRead?.();
					sonnerToast.dismiss(id);
				}}
			/>
		),
		{
			duration: 100000,
			className: "!min-w-0 !w-auto",
			...toastOptions,
		},
	);
}
