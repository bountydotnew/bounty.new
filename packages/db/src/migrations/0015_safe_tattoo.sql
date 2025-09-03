CREATE TABLE "bounty_comment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bounty_comment_like" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bounty_vote" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comment" ADD CONSTRAINT "bounty_comment_parent_id_bounty_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bounty_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comment_like" ADD CONSTRAINT "bounty_comment_like_comment_id_bounty_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."bounty_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comment_like" ADD CONSTRAINT "bounty_comment_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_vote" ADD CONSTRAINT "bounty_vote_bounty_id_bounty_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_vote" ADD CONSTRAINT "bounty_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bounty_comment_bounty_id_idx" ON "bounty_comment" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "bounty_comment_user_id_idx" ON "bounty_comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bounty_comment_parent_id_idx" ON "bounty_comment" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_comment_like_unique_idx" ON "bounty_comment_like" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "bounty_comment_like_comment_id_idx" ON "bounty_comment_like" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "bounty_comment_like_user_id_idx" ON "bounty_comment_like" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bounty_vote_unique_idx" ON "bounty_vote" USING btree ("bounty_id","user_id");--> statement-breakpoint
CREATE INDEX "bounty_vote_bounty_id_idx" ON "bounty_vote" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "bounty_vote_user_id_idx" ON "bounty_vote" USING btree ("user_id");