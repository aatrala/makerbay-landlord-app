import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

// This module is imported before the application entry point under ESM, so load
// the root environment file here before creating the database connection.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(__dirname, "../../../.env"), // server/src -> project root
  path.resolve(__dirname, "../../.env"), // server (compiled) -> project root
  path.resolve(process.cwd(), "../.env"), // CWD server -> project root
  path.resolve(process.cwd(), ".env"), // CWD project root
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL, or set DATABASE_URL=pglite://./pgdata to run on an embedded database.",
  );
}

// Embedded PGlite database (no external Postgres required). Useful for local
// development and demos where Docker/Postgres are not available.
export const isPglite = connectionString.startsWith("pglite:");

type AppDatabase = PostgresJsDatabase<typeof schema & typeof relations>;

let db!: AppDatabase;

if (isPglite) {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const dataDir = connectionString.slice("pglite:".length) || "./pgdata";
  const resolvedDir = path.isAbsolute(dataDir)
    ? dataDir
    : path.resolve(process.cwd(), dataDir);
  const client = new PGlite(resolvedDir);
  db = drizzlePglite(client, {
    schema: { ...schema, ...relations },
  }) as unknown as AppDatabase;

  const { migratePglite } = await import("./migrate.js");
  await migratePglite(client);
} else {
  const postgres = (await import("postgres")).default;
  const client = postgres(connectionString);
  db = drizzle(client, { schema: { ...schema, ...relations } });
}

export { db };
export type Database = typeof db;
