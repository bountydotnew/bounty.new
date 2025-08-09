-- Create beta_application_status enum
CREATE TYPE "beta_application_status" AS ENUM('pending', 'approved', 'rejected');

-- Create beta_application table
CREATE TABLE "beta_application" (
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

-- Add foreign key constraints
ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE set null;