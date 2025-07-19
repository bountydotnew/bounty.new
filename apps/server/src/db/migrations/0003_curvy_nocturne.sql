ALTER TABLE "user" ADD COLUMN "is_first_login" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_auth_provider" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "ip_address" text;