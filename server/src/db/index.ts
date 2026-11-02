import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

export const fullSchema = { ...schema, ...relations };
export type AppDatabase = PostgresJsDatabase<typeof fullSchema>;

/**
 * Workers forbid sharing I/O objects (DB sockets) between requests, so each
 * request/cron invocation gets its own client via AsyncLocalStorage. Route code
 * keeps importing `db` and the proxy resolves to the current request's client.
 */
const storage = new AsyncLocalStorage<AppDatabase>();
let defaultDb: AppDatabase | undefined;

export function setDefaultDb(d: AppDatabase | undefined) {
  defaultDb = d;
}

export function runWithDb<T>(d: AppDatabase, fn: () => T): T {
  return storage.run(d, fn);
}

export function currentDb(): AppDatabase {
  const d = storage.getStore() ?? defaultDb;
  if (!d) throw new Error("No database bound for this request");
  return d;
}

export const db: AppDatabase = new Proxy({} as AppDatabase, {
  get(_t, prop) {
    const d = currentDb() as any;
    const v = d[prop];
    return typeof v === "function" ? v.bind(d) : v;
  },
});

/** Postgres (Neon via Hyperdrive on Workers, or any DATABASE_URL in Node). */
export async function createPostgresDb(connectionString: string) {
  const postgres = (await import("postgres")).default;
  const client = postgres(connectionString, { max: 5, fetch_types: false });
  const d = drizzle(client, { schema: fullSchema });
  return { db: d, close: () => client.end({ timeout: 5 }) };
}

export type Database = AppDatabase;
