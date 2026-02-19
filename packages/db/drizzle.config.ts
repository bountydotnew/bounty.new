import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/migrations",
	schema: "./src/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
	tablesFilter: ["!pg_stat_statements", "!pg_stat_statements_info"],
});
