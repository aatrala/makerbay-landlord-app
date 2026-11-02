/// <reference types="@cloudflare/workers-types" />

/** Cloudflare bindings + vars. All secrets are set with `wrangler secret put`. */
export type Bindings = {
  HYPERDRIVE?: Hyperdrive;
  UPLOADS?: R2Bucket;
  ASSETS?: Fetcher;
  APP_URL?: string;
  EMAIL_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
};

export type AppVariables = {
  userId: string;
  session: unknown;
  body: any;
  rawBody: string;
};

export type AppEnv = { Bindings: Bindings; Variables: AppVariables };

/** Read a config value from process.env (populated by nodejs_compat on Workers). */
export function envVar(name: string): string | undefined {
  const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return v === "" ? undefined : v;
}
