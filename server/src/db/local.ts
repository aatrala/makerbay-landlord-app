// Node-only helpers (local dev, seed, tests). Never imported by the Worker,
// so PGlite's WASM is not bundled into the deployment.
import { fullSchema, type AppDatabase } from "./index.js";

/** Embedded PGlite (local dev + tests). Pass undefined for in-memory. */
export async function createPgliteDb(dataDir?: string) {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite(dataDir);
  const d = drizzlePglite(client, { schema: fullSchema }) as unknown as AppDatabase;
  const { migratePglite } = await import("./migrate.js");
  await migratePglite(client);
  return { db: d, client, close: () => client.close() };
}

