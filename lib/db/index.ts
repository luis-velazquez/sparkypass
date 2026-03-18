// Database connection for SparkyPass
// Uses Turso (libSQL) in production, better-sqlite3 for local development
import * as schema from "./schema";

function createDb() {
  if (process.env.TURSO_DATABASE_URL) {
    // Production: use Turso / libSQL
    const { createClient } = require("@libsql/client");
    const { drizzle } = require("drizzle-orm/libsql");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  } else {
    // Local development: use better-sqlite3
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "sparkypass.db");
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema });
  }
}

export const db = createDb();

// Export schema for convenience
export * from "./schema";
