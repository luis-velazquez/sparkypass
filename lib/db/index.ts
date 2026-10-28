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
    // On Vercel a missing TURSO_DATABASE_URL must fail LOUDLY: better-sqlite3
    // is a real dependency there, so the fallback would silently serve an
    // empty ephemeral database instead of production data.
    if (process.env.VERCEL) {
      throw new Error(
        "TURSO_DATABASE_URL is not set — refusing to fall back to local sqlite on Vercel.",
      );
    }
    // Local development: use better-sqlite3
    const Database = require("better-sqlite3");
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "sparkypass.db");
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema });
  }
}

type Db = ReturnType<typeof createDb>;

// Lazy: Next's build-time page-data collection evaluates this module for
// every route importing @/lib/db — constructing the client there couples
// builds to database env vars (same failure class as lib/stripe, 2026-07-14).
// First property access (always at request time) constructs the real client.
let _db: Db | null = null;
function getDb(): Db {
  if (!_db) _db = createDb();
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop, getDb());
  },
});

// Export schema for convenience
export * from "./schema";
