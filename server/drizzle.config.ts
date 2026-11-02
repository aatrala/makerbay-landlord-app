import { defineConfig } from "drizzle-kit";

// DATABASE_URL must be the *direct* Neon connection string (not Hyperdrive).
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/managehomestay",
  },
});
