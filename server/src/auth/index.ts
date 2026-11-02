import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha } from "better-auth/plugins";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { envVar } from "../env.js";

function build() {
  const appUrl = envVar("APP_URL") || envVar("BETTER_AUTH_URL") || "http://localhost:5173";
  const turnstileSecret = envVar("TURNSTILE_SECRET_KEY");
  return betterAuth({
    appName: "Manage Homestay",
    baseURL: envVar("BETTER_AUTH_URL") || appUrl,
    secret: envVar("BETTER_AUTH_SECRET"),
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [appUrl, "http://localhost:5173"],
    // Cloudflare Turnstile on sign-up and sign-in (client sends x-captcha-response).
    plugins: turnstileSecret
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: turnstileSecret,
            endpoints: ["/sign-up/email", "/sign-in/email"],
          }),
        ]
      : [],
  });
}

type Auth = ReturnType<typeof build>;
let instance: Auth | undefined;
let builtFor: string | undefined;

/** Lazily build Better-Auth so env (Workers secrets) is read at request time. */
export function getAuth(): Auth {
  const key = `${envVar("BETTER_AUTH_URL")}|${envVar("APP_URL")}|${envVar("TURNSTILE_SECRET_KEY") ? 1 : 0}`;
  if (!instance || builtFor !== key) {
    instance = build();
    builtFor = key;
  }
  return instance;
}

export type AuthSession = Auth["$Infer"]["Session"];

/** Force a rebuild on next use (tests). */
export function resetAuth() {
  instance = undefined;
  builtFor = undefined;
}
