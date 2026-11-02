// Local Node dev server (the production runtime is src/worker.ts on Cloudflare).
import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { createPostgresDb, setDefaultDb } from "./db/index.js";
import { createPgliteDb } from "./db/local.js";

const url = process.env.DATABASE_URL || "pglite:./pgdata";
const { db } = url.startsWith("pglite:")
  ? await createPgliteDb(url.slice("pglite:".length) || "./pgdata")
  : await createPostgresDb(url);
setDefaultDb(db);

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`[Manage Homestay] API on http://localhost:${port}`);
});
