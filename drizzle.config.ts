import { config } from "dotenv";
config({ path: ".env.local" });

import type { Config } from "drizzle-kit";

const DEFAULT_DB_URL = "postgresql://framemind:framemind@127.0.0.1:5432/framemind";
const dbUrl = process.env.FRAMEMIND_DB_URL?.trim() || process.env.DB_URL?.trim() || DEFAULT_DB_URL;

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;
