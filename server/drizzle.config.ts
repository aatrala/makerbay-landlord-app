import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root (one level up from server/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://rentlite:rentlite_dev@localhost:5432/rentlite",
  },
});
