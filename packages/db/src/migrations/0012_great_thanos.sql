ALTER TABLE "passkey" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "passkey" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;