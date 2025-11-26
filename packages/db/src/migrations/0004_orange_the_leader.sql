CREATE TYPE "public"."bounty_draft_status" AS ENUM('draft', 'pending_review', 'approved');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('creator', 'developer');--> statement-breakpoint
CREATE TABLE "bounty_draft" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waitlist_entry_id" text NOT NULL,
	"title" text,
	"description" text,
	"price" integer,
	"github_issue_url" text,
	"status" "bounty_draft_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_entry" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"otp_code" text,
	"otp_expires_at" timestamp,
	"otp_attempts" integer DEFAULT 0 NOT NULL,
	"name" text,
	"username" text,
	"role" "user_role",
	"github_id" text,
	"github_username" text,
	"position" integer,
	"referral_code" text,
	"referred_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"onboarding_completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entry_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_entry_username_unique" UNIQUE("username"),
	CONSTRAINT "waitlist_entry_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "bounty_draft" ADD CONSTRAINT "bounty_draft_waitlist_entry_id_waitlist_entry_id_fk" FOREIGN KEY ("waitlist_entry_id") REFERENCES "public"."waitlist_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entry" ADD CONSTRAINT "waitlist_entry_referred_by_waitlist_entry_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."waitlist_entry"("id") ON DELETE set null ON UPDATE no action;