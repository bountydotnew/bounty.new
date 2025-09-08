CREATE TYPE "public"."access_stage" AS ENUM('none', 'alpha', 'beta', 'production');--> statement-breakpoint
ALTER TABLE "bounty" ALTER COLUMN "requirements" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "bounty" ALTER COLUMN "requirements" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bounty" ALTER COLUMN "deliverables" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "bounty" ALTER COLUMN "deliverables" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_stage" "access_stage" DEFAULT 'none' NOT NULL;