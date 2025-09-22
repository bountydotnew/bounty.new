ALTER TABLE "bounty" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "user_profile" ADD COLUMN "onboarding_completed" boolean DEFAULT false;