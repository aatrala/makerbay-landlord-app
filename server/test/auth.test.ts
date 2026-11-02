import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { call, setupDb, signUp } from "./helpers.js";
import { resetAuth } from "../src/auth/index.js";

let close: () => Promise<void>;
beforeAll(async () => ({ close } = await setupDb()));
afterAll(async () => close());

describe("auth", () => {
  it("rejects unauthenticated API calls", async () => {
    expect((await call("GET", "/api/properties")).status).toBe(401);
    expect((await call("GET", "/api/str/listings")).status).toBe(401);
  });

  it("signs up, reads session and signs in", async () => {
    const email = "host@example.test";
    const up = await call("POST", "/api/auth/sign-up/email", { email, password: "password-1234", name: "Host" });
    expect(up.status).toBe(200);
    const cookie = (up.headers.get("set-cookie") || "").split(";")[0];
    const s = await call("GET", "/api/auth/get-session", undefined, { cookie });
    expect(s.json.user.email).toBe(email);

    const bad = await call("POST", "/api/auth/sign-in/email", { email, password: "wrong-password" });
    expect(bad.status).toBe(401);
    const ok = await call("POST", "/api/auth/sign-in/email", { email, password: "password-1234" });
    expect(ok.status).toBe(200);
  });

  it("requires a Turnstile token when TURNSTILE_SECRET_KEY is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-turnstile-placeholder";
    resetAuth();
    try {
      const r = await call("POST", "/api/auth/sign-up/email", {
        email: "bot@example.test",
        password: "password-1234",
        name: "Bot",
      });
      expect(r.status).toBe(400);
      const r2 = await call("POST", "/api/auth/sign-in/email", { email: "host@example.test", password: "password-1234" });
      expect(r2.status).toBe(400);
    } finally {
      delete process.env.TURNSTILE_SECRET_KEY;
      resetAuth();
    }
  });

  it("exposes public config and health", async () => {
    expect((await call("GET", "/api/health")).json.status).toBe("ok");
    expect((await call("GET", "/api/config")).status).toBe(200);
  });
});
