import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let siteKeyPromise: Promise<string | null> | null = null;
function loadSiteKey() {
  siteKeyPromise ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.data?.turnstileSiteKey || null)
    .catch(() => null);
  return siteKeyPromise;
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. `enabled` is false when the server has no site
 * key configured (local dev), in which case no token is required.
 */
export function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSiteKey().then(async (key) => {
      if (!key || cancelled) return;
      setEnabled(true);
      await loadScript();
      if (cancelled || !ref.current || !window.turnstile) return;
      widget.current = window.turnstile.render(ref.current, {
        sitekey: key,
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null),
      });
    });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, []);

  const reset = () => {
    setToken(null);
    if (widget.current) window.turnstile?.reset(widget.current);
  };
  const headers = (): Record<string, string> => (token ? { "x-captcha-response": token } : {});
  const element = <div ref={ref} className="min-h-[65px]" />;
  return { element, token, enabled, ready: !enabled || !!token, headers, reset };
}
