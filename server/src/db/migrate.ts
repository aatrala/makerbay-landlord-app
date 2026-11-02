import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Applies the generated Drizzle SQL migrations to an embedded PGlite database
// (local dev and tests). Production Postgres uses `drizzle-kit migrate`.
export async function migratePglite(client: { exec: (sql: string) => Promise<unknown> }) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../drizzle"),
    path.resolve(here, "../drizzle"),
    path.resolve(process.cwd(), "drizzle"),
    path.resolve(process.cwd(), "server/drizzle"),
  ];
  const dir = candidates.find((p) => fs.existsSync(path.join(p, "meta")));
  if (!dir) throw new Error("No drizzle migrations directory found.");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const statements = fs
      .readFileSync(path.join(dir, file), "utf-8")
      .split("--> statement-breakpoint");
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        await client.exec(stmt);
      } catch (err) {
        // Persistent PGlite dirs survive restarts: ignore "already exists".
        if (!/already exists/i.test(String((err as Error)?.message))) throw err;
      }
    }
  }
}
