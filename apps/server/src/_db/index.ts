import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./schema/auth";
import * as bountiesSchema from "./schema/bounties";
import * as profilesSchema from "./schema/profiles";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...bountiesSchema,
    ...profilesSchema,
  },
});

