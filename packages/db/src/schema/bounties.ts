import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const bountyStatusEnum = pgEnum("bounty_status", [
  "draft",
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "revision_requested",
]);
export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const bounty = pgTable("bounty", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").array(),
  deliverables: text("deliverables").array(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: bountyStatusEnum("status").notNull().default("draft"),
  difficulty: difficultyEnum("difficulty").notNull().default("intermediate"),
  deadline: timestamp("deadline"),
  tags: text("tags").array(),
  repositoryUrl: text("repository_url"),
  issueUrl: text("issue_url"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  assignedToId: text("assigned_to_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const submission = pgTable("submission", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bountyId: text("bounty_id")
    .notNull()
    .references(() => bounty.id, { onDelete: "cascade" }),
  contributorId: text("contributor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  deliverableUrl: text("deliverable_url").notNull(),
  pullRequestUrl: text("pull_request_url"),
  status: submissionStatusEnum("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at")
    .notNull()
    .default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const bountyApplication = pgTable("bounty_application", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bountyId: text("bounty_id")
    .notNull()
    .references(() => bounty.id, { onDelete: "cascade" }),
  applicantId: text("applicant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isAccepted: boolean("is_accepted").default(false),
  appliedAt: timestamp("applied_at")
    .notNull()
    .default(sql`now()`),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});
