import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

// This module is imported before the application entry point under ESM, so load
// the root environment file here before creating the PostgreSQL connection.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema: { ...schema, ...relations } });
export type Database = typeof db;
