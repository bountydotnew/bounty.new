import { sql } from "drizzle-orm";
import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const featureTypeEnum = pgEnum("feature_type", ["integration"]);

export const featureVote = pgTable(
	"feature_vote",
	{
		id: text("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		featureType: featureTypeEnum("feature_type").notNull(),
		featureKey: text("feature_key").notNull(), // e.g., 'vscode', 'notion', 'crypto', 'email'
		createdAt: timestamp("created_at").notNull().default(sql`now()`),
	},
	(table) => [
		// Each user can only vote once per feature type
		uniqueIndex("feature_vote_user_feature_type_idx").on(
			table.userId,
			table.featureType,
		),
	],
);
