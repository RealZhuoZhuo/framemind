import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: postgres.Sql | undefined;
}

const pool = globalThis.__pgPool ?? postgres(process.env.DB_URL!, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}

export const db = drizzle(pool, { schema });
