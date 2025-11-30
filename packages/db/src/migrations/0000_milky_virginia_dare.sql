DO $$ BEGIN
 CREATE TYPE "public"."access_stage" AS ENUM('none', 'alpha', 'beta', 'production');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."beta_access_status" AS ENUM('none', 'pending', 'approved', 'denied');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."device_code_status" AS ENUM('pending', 'approved', 'denied');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."beta_application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bounty_status" AS ENUM('draft', 'open', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected', 'revision_requested');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('system', 'bounty_comment', 'submission_received', 'submission_approved', 'submission_rejected', 'bounty_awarded', 'beta_application_approved', 'beta_application_rejected', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_code" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" text,
	"client_id" text,
	"scope" text,
	"status" "device_code_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_polled_at" timestamp,
	"polling_interval" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_code_device_code_unique" UNIQUE("device_code"),
	CONSTRAINT "device_code_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_otp" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"otp_code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "last_login_method" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"method" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"has_access" boolean DEFAULT false NOT NULL,
	"beta_access_status" "beta_access_status" DEFAULT 'none' NOT NULL,
	"access_stage" "access_stage" DEFAULT 'none' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waitlist" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"has_access" boolean DEFAULT false NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beta_application" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"twitter" text NOT NULL,
	"project_name" text NOT NULL,
	"project_link" text NOT NULL,
	"description" text NOT NULL,
	"status" "beta_application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "bounty_status" DEFAULT 'draft' NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"deadline" timestamp,
	"tags" text[],
	"repository_url" text,
	"issue_url" text,
	"created_by_id" text NOT NULL,
	"assigned_to_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty_application" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"applicant_id" text NOT NULL,
	"message" text NOT NULL,
	"is_accepted" boolean DEFAULT false,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty_bookmark" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty_comment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"content" text NOT NULL,
	"original_content" text,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty_comment_like" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bounty_vote" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"contributor_id" text NOT NULL,
	"description" text NOT NULL,
	"deliverable_url" text NOT NULL,
	"pull_request_url" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"access_stage" "access_stage" NOT NULL,
	"expires_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_by_user_id" text,
	CONSTRAINT "invite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"publicKey" text NOT NULL,
	"userId" text NOT NULL,
	"credentialID" text NOT NULL,
	"counter" integer NOT NULL,
	"deviceType" text NOT NULL,
	"backedUp" boolean NOT NULL,
	"transports" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profile" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bio" text,
	"location" text,
	"website" text,
	"github_username" text,
	"twitter_username" text,
	"linkedin_url" text,
	"skills" text[],
	"preferred_languages" text[],
	"hourly_rate" numeric(10, 2),
	"currency" text DEFAULT 'USD',
	"timezone" text,
	"available_for_work" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_rating" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rated_user_id" text NOT NULL,
	"rater_user_id" text NOT NULL,
	"bounty_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_reputation" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"total_earned" numeric(12, 2) DEFAULT 0.00,
	"bounties_completed" integer DEFAULT 0,
	"bounties_created" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT 0.00,
	"total_ratings" integer DEFAULT 0,
	"success_rate" numeric(5, 2) DEFAULT 0.00,
	"response_time" integer,
	"completion_rate" numeric(5, 2) DEFAULT 0.00,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_reputation_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_code" ADD CONSTRAINT "device_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_otp" ADD CONSTRAINT "email_otp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "last_login_method" ADD CONSTRAINT "last_login_method_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "beta_application" ADD CONSTRAINT "beta_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty" ADD CONSTRAINT "bounty_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty" ADD CONSTRAINT "bounty_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_application" ADD CONSTRAINT "bounty_application_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_application" ADD CONSTRAINT "bounty_application_applicant_id_user_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_bookmark" ADD CONSTRAINT "bounty_bookmark_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_bookmark" ADD CONSTRAINT "bounty_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_parent_id_bounty_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bounty_comment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_comment_like" ADD CONSTRAINT "bounty_comment_like_comment_id_bounty_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."bounty_comment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_comment_like" ADD CONSTRAINT "bounty_comment_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_vote" ADD CONSTRAINT "bounty_vote_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bounty_vote" ADD CONSTRAINT "bounty_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission" ADD CONSTRAINT "submission_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission" ADD CONSTRAINT "submission_contributor_id_user_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite" ADD CONSTRAINT "invite_used_by_user_id_user_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_rating" ADD CONSTRAINT "user_rating_rated_user_id_user_id_fk" FOREIGN KEY ("rated_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_rating" ADD CONSTRAINT "user_rating_rater_user_id_user_id_fk" FOREIGN KEY ("rater_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_rating" ADD CONSTRAINT "user_rating_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_reputation" ADD CONSTRAINT "user_reputation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE UNIQUE INDEX "bounty_bookmark_unique_idx" ON "bounty_bookmark" USING btree ("bounty_id","user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_bookmark_bounty_id_idx" ON "bounty_bookmark" USING btree ("bounty_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_bookmark_user_id_idx" ON "bounty_bookmark" USING btree ("user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_comment_bounty_id_idx" ON "bounty_comment" USING btree ("bounty_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_comment_user_id_idx" ON "bounty_comment" USING btree ("user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_comment_parent_id_idx" ON "bounty_comment" USING btree ("parent_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE UNIQUE INDEX "bounty_comment_like_unique_idx" ON "bounty_comment_like" USING btree ("comment_id","user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_comment_like_comment_id_idx" ON "bounty_comment_like" USING btree ("comment_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_comment_like_user_id_idx" ON "bounty_comment_like" USING btree ("user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE UNIQUE INDEX "bounty_vote_unique_idx" ON "bounty_vote" USING btree ("bounty_id","user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_vote_bounty_id_idx" ON "bounty_vote" USING btree ("bounty_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "bounty_vote_user_id_idx" ON "bounty_vote" USING btree ("user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("user_id");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "notification_read_idx" ON "notification" USING btree ("read");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "notification_type_idx" ON "notification" USING btree ("type");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");
EXCEPTION
 WHEN duplicate_table THEN null;
END $$;