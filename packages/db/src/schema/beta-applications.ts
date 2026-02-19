import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const betaApplicationStatusEnum = pgEnum("beta_application_status", [
	"pending",
	"approved",
	"rejected",
]);

export const betaApplication = pgTable("beta_application", {
	id: text("id").primaryKey().default(sql`gen_random_uuid()`),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	twitter: text("twitter").notNull(),
	projectName: text("project_name").notNull(),
	projectLink: text("project_link").notNull(),
	description: text("description").notNull(),
	status: betaApplicationStatusEnum("status").notNull().default("pending"),
	reviewedBy: text("reviewed_by").references(() => user.id, {
		onDelete: "set null",
	}),
	reviewedAt: timestamp("reviewed_at"),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at").notNull().default(sql`now()`),
	updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});
