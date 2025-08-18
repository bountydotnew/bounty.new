CREATE TYPE "public"."access_stage" AS ENUM('none', 'alpha', 'beta', 'production');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_stage" "access_stage" DEFAULT 'none' NOT NULL;--> statement-breakpoint

-- Migrate existing beta access status to new access stage
UPDATE "user" SET "access_stage" = 'beta' WHERE "beta_access_status" = 'approved';
