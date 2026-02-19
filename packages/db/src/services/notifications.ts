import { and, count, desc, eq, lt } from "drizzle-orm";
import { db } from "../index";
import {
	notification,
	type notificationTypeEnum,
} from "../schema/notifications";

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export interface CreateNotificationInput {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	data?: {
		bountyId?: string;
		submissionId?: string;
		commentId?: string;
		linkTo?: string;
		applicationId?: string;
		// User who performed the action
		userId?: string;
		userName?: string;
		userImage?: string;
		[key: string]: unknown;
	};
}

export interface GetNotificationsOptions {
	limit?: number;
	offset?: number;
	unreadOnly?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
	const [newNotification] = await db
		.insert(notification)
		.values({
			userId: input.userId,
			type: input.type,
			title: input.title,
			message: input.message,
			data: input.data,
		})
		.returning();

	return newNotification;
}

export async function getNotificationsForUser(
	userId: string,
	options: GetNotificationsOptions = {},
) {
	const { limit = 50, offset = 0, unreadOnly = false } = options;

	const whereConditions = unreadOnly
		? and(eq(notification.userId, userId), eq(notification.read, false))
		: eq(notification.userId, userId);

	return await db.query.notification.findMany({
		where: whereConditions,
		orderBy: [desc(notification.createdAt)],
		limit,
		offset,
	});
}

export async function markNotificationAsRead(
	notificationId: string,
	userId: string,
) {
	const [updatedNotification] = await db
		.update(notification)
		.set({
			read: true,
			updatedAt: new Date(),
		})
		.where(
			and(eq(notification.id, notificationId), eq(notification.userId, userId)),
		)
		.returning();

	return updatedNotification;
}

export async function markAllNotificationsAsRead(userId: string) {
	const updatedNotifications = await db
		.update(notification)
		.set({
			read: true,
			updatedAt: new Date(),
		})
		.where(eq(notification.userId, userId))
		.returning();

	return updatedNotifications;
}

export async function getUnreadNotificationCount(userId: string) {
	const [result] = await db
		.select({ count: count() })
		.from(notification)
		.where(and(eq(notification.userId, userId), eq(notification.read, false)));

	return result?.count ?? 0;
}

export async function cleanupOldNotifications(daysToKeep = 30) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

	const deletedNotifications = await db
		.delete(notification)
		.where(
			and(eq(notification.read, true), lt(notification.createdAt, cutoffDate)),
		)
		.returning();

	return deletedNotifications;
}

export interface CreateNotificationWithActorInput
	extends Omit<CreateNotificationInput, "data"> {
	actor: {
		id: string;
		name?: string | null;
		image?: string | null;
	};
	data?: Omit<
		CreateNotificationInput["data"],
		"userId" | "userName" | "userImage"
	>;
}

export async function createNotificationWithActor(
	input: CreateNotificationWithActorInput,
) {
	return createNotification({
		...input,
		data: {
			...input.data,
			userId: input.actor.id,
			userName: input.actor.name ?? undefined,
			userImage: input.actor.image ?? undefined,
		},
	});
}
