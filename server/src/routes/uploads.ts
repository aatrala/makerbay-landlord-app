import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { authMiddleware } from "../auth/middleware.js";

// R2-backed uploads (replaces multer + local disk).
const router = new Hono<AppEnv>();
router.use("*", authMiddleware);

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|heic)|application\/pdf)$/;

router.post("/", async (c) => {
  const bucket = c.env?.UPLOADS;
  if (!bucket) return c.json({ message: "Uploads are not configured", code: "NO_STORAGE" }, 503);
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return c.json({ message: "Missing file", code: "VALIDATION" }, 400);
  if (file.size > MAX_BYTES) return c.json({ message: "File too large (max 10MB)", code: "TOO_LARGE" }, 413);
  if (!ALLOWED.test(file.type)) return c.json({ message: "Unsupported file type", code: "BAD_TYPE" }, 415);
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";
  const key = `${c.get("userId")}/${crypto.randomUUID()}-${safeName}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return c.json({ data: { key, url: `/api/uploads/${key}` } }, 201);
});

// Any signed-in user can read by unguessable key (tenants upload photos that
// landlords view and vice versa).
router.get("/*", async (c) => {
  const bucket = c.env?.UPLOADS;
  if (!bucket) return c.json({ message: "Uploads are not configured", code: "NO_STORAGE" }, 503);
  const key = decodeURIComponent(c.req.path.replace(/^\/api\/uploads\//, ""));
  const obj = await bucket.get(key);
  if (!obj) return c.json({ message: "Not found", code: "NOT_FOUND" }, 404);
  return new Response(obj.body as ReadableStream, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=3600",
    },
  });
});

export { router as uploadsRouter };
