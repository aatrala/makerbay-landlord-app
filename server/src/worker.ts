import type { Bindings } from "./env.js";
import { app } from "./app.js";
import { createPostgresDb, runWithDb } from "./db/index.js";
import { runDailyJobs } from "./jobs.js";

function connectionString(env: Bindings) {
  const url = env.HYPERDRIVE?.connectionString || process.env.DATABASE_URL;
  if (!url) throw new Error("No HYPERDRIVE binding or DATABASE_URL configured");
  return url;
}

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      // Static assets normally answer before the Worker runs; this is a fallback.
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    }
    const { db, close } = await createPostgresDb(connectionString(env));
    try {
      return await runWithDb(db, () => app.fetch(request, env, ctx));
    } finally {
      ctx.waitUntil(close());
    }
  },

  async scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    const { db, close } = await createPostgresDb(connectionString(env));
    try {
      await runWithDb(db, () => runDailyJobs());
    } finally {
      ctx.waitUntil(close());
    }
  },
} satisfies ExportedHandler<Bindings>;
