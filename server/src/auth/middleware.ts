import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env.js";
import { getAuth } from "./index.js";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  c.set("session", session);
  c.set("userId", session.user.id);
  await next();
});
