/**
 * After sign-in / sign-up, the session cookie is set but the `useSession` store
 * may still hold the old "signed out" value. Navigating client-side right away
 * lets ProtectedRoute see no user and bounce back to /login, so users had to
 * sign in twice. Instead: confirm the session with the server, then do a full
 * navigation so the app boots with the fresh session.
 */
export async function completeAuthRedirect(deps: {
  getSession: () => Promise<{ data?: { user?: unknown } | null; error?: unknown } | null | undefined>;
  navigate: (url: string) => void;
  to?: string;
  retries?: number;
  delayMs?: number;
}): Promise<boolean> {
  const { getSession, navigate, to = "/", retries = 3, delayMs = 250 } = deps;
  for (let i = 0; i <= retries; i++) {
    const res = await getSession().catch(() => null);
    if (res?.data?.user) {
      navigate(to);
      return true;
    }
    if (i < retries) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
