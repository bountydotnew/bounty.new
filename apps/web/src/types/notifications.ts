export interface NotificationData {
	linkTo?: string;
	[key: string]: unknown;
}

export interface NotificationItem {
	id: string;
	type: string;
	title: string;
	message: string;
	read: boolean;
	createdAt: Date | string;
	data: NotificationData | null;
}

export interface NotificationRowProps {
	item: NotificationItem;
	onRead: (id: string) => void;
}
