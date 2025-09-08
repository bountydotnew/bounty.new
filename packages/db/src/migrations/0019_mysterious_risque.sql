CREATE TABLE "bounty_bookmark" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "bounty_comment_unique_user_content_per_bounty";--> statement-breakpoint
ALTER TABLE "bounty_bookmark" ADD CONSTRAINT "bounty_bookmark_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_bookmark" ADD CONSTRAINT "bounty_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_bookmark_unique_idx" ON "bounty_bookmark" USING btree ("bounty_id","user_id");--> statement-breakpoint
CREATE INDEX "bounty_bookmark_bounty_id_idx" ON "bounty_bookmark" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "bounty_bookmark_user_id_idx" ON "bounty_bookmark" USING btree ("user_id");