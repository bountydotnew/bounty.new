import { defineConfig } from "drizzle-kit";
import { env } from "@bounty/env/server";

export default defineConfig({
  schema: "../../packages/db/src/schema",
  out: "../../packages/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
