CREATE TABLE "linked_account" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"linked_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "linked_account_user_id_linked_user_id_unique" UNIQUE("user_id","linked_user_id")
);
--> statement-breakpoint
ALTER TABLE "linked_account" ADD CONSTRAINT "linked_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_account" ADD CONSTRAINT "linked_account_linked_user_id_user_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;