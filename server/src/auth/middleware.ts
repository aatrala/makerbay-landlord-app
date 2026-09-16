import { toNodeHandler } from "better-auth/node";
import type { Request, Response, NextFunction } from "express";
import { auth } from "./index.js";

// Better-Auth mount point for Express
export const authHandler = toNodeHandler(auth);

// Middleware to extract session from Better-Auth
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: req.headers as unknown as Headers,
  });

  if (!session) {
    res.status(401).json({ message: "Unauthorized", code: "UNAUTHORIZED" });
    return;
  }

  // Attach session to request
  (req as any).session = session;
  (req as any).userId = session.user.id;
  next();
}

// Optional: middleware that allows unauthenticated access
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  auth.api.getSession({ headers: req.headers as unknown as Headers }).then(
    (session) => {
      if (session) {
        (req as any).session = session;
        (req as any).userId = session.user.id;
      }
      next();
    },
  );
}
