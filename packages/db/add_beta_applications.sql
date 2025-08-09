-- Add beta applications table (standalone script)
-- Run this manually if migrations are out of sync

-- Create beta_application_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "beta_application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create beta_application table if it doesn't exist
CREATE TABLE IF NOT EXISTS "beta_application" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"twitter" text NOT NULL,
	"project_name" text NOT NULL,
	"project_link" text NOT NULL,
	"description" text NOT NULL,
	"status" "beta_application_status" NOT NULL DEFAULT 'pending',
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE set null;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;