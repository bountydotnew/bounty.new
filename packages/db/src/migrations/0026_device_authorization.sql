CREATE TYPE "device_code_status" AS ENUM ('pending', 'approved', 'denied');

CREATE TABLE IF NOT EXISTS "device_code" (
    "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
    "device_code" text NOT NULL,
    "user_code" text NOT NULL,
    "user_id" text,
    "client_id" text,
    "scope" text,
    "status" "device_code_status" NOT NULL DEFAULT 'pending',
    "expires_at" timestamp NOT NULL,
    "last_polled_at" timestamp,
    "polling_interval" integer,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "device_code"
    ADD CONSTRAINT "device_code_device_code_unique" UNIQUE ("device_code");

ALTER TABLE "device_code"
    ADD CONSTRAINT "device_code_user_code_unique" UNIQUE ("user_code");

ALTER TABLE "device_code"
    ADD CONSTRAINT "device_code_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL;
