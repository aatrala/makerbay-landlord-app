import { createAuthClient } from "better-auth/react";

// Same-origin in production (Worker serves the SPA and /api); Vite proxies /api in dev.
const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
});

export const { signIn, signUp, signOut, useSession } = authClient;
