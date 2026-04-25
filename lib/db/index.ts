import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pgPool: postgres.Sql | undefined;
  var __pgPoolConnectionString: string | undefined;
}

const DEFAULT_DB_URL = "postgresql://framemind:framemind@127.0.0.1:5432/framemind";
const DEV_DB_URL = process.env.FRAMEMIND_DB_URL?.trim() || DEFAULT_DB_URL;
const PROD_DB_URL =
  process.env.FRAMEMIND_DB_URL?.trim() ||
  process.env.DB_URL?.trim() ||
  DEFAULT_DB_URL;
const connectionString = process.env.NODE_ENV === "production" ? PROD_DB_URL : DEV_DB_URL;

if (globalThis.__pgPool && globalThis.__pgPoolConnectionString !== connectionString) {
  void globalThis.__pgPool.end({ timeout: 0 });
  globalThis.__pgPool = undefined;
}

const pool = globalThis.__pgPool ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
  globalThis.__pgPoolConnectionString = connectionString;
}

export const db = drizzle(pool, { schema });
