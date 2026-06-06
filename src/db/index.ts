import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

const db = drizzle(databaseUrl, {
  logger: process.env.DEBUG === "true",
});

export default db;
