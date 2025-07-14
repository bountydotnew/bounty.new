import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as bountiesSchema from "./schema/bounties";
import * as profilesSchema from "./schema/profiles";

export const db = drizzle(process.env.DATABASE_URL || "", {
  schema: {
    ...authSchema,
    ...bountiesSchema,
    ...profilesSchema,
  },
});

