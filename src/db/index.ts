import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/env";

const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

const conn = globalForDb.conn ?? new Pool({ connectionString: env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

const db = drizzle(conn, {
  logger: env.DEBUG === "true",
});

export default db;


