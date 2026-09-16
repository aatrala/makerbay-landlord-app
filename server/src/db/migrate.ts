import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Reads the generated Drizzle migration and applies it to an embedded PGlite
// database on first boot.
export async function migratePglite(client: {
  exec: (sql: string) => Promise<unknown>;
}) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(__dirname, "../../drizzle"), // server/src/db -> server/drizzle
    path.resolve(__dirname, "../drizzle"), // server (compiled) -> server/drizzle
    path.resolve(process.cwd(), "drizzle"),
  ];
  const dir = candidates.find((p) => fs.existsSync(p));
  if (!dir) {
    throw new Error("No drizzle migrations directory found.");
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs
      .readFileSync(path.join(dir, file), "utf-8")
      .split("--> statement-breakpoint")
      .join("");

    try {
      await client.exec(sql);
    } catch {
      // Already applied (e.g. table/type exists) — PGlite databases live on
      // disk across restarts, so skip statements that are already present.
    }
  }
}
