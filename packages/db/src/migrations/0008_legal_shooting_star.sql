CREATE TYPE "public"."beta_access_status" AS ENUM('none', 'pending', 'approved', 'denied');--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "beta_access" TO "beta_access_status";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "beta_access_denied";