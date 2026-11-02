import { createPgliteDb } from "../src/db/local.js";
import { setDefaultDb } from "../src/db/index.js";
import { app } from "../src/app.js";

export const ORIGIN = "http://localhost:5173";

export async function setupDb() {
  process.env.BETTER_AUTH_SECRET = "test-only-secret-not-used-anywhere-else-0123456789";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.APP_URL = ORIGIN;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;
  const { db, close } = await createPgliteDb();
  setDefaultDb(db);
  return { db, close };
}

export type Client = {
  cookie: string;
  req: (method: string, path: string, body?: unknown) => Promise<{ status: number; json: any; text: string }>;
};

export async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await app.request(path, {
    method,
    headers: { origin: ORIGIN, ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text, headers: res.headers };
}

let n = 0;
export async function signUp(): Promise<Client> {
  const email = `user${++n}-${Date.now()}@example.test`;
  const r = await call("POST", "/api/auth/sign-up/email", { email, password: "password-1234", name: "Test User" });
  if (r.status !== 200) throw new Error(`signup failed ${r.status} ${r.text}`);
  const cookie = (r.headers.get("set-cookie") || "").split(";")[0];
  return {
    cookie,
    req: (method, path, body) => call(method, path, body, { cookie }),
  };
}

export async function makeListing(c: Client, overrides: Record<string, unknown> = {}) {
  const p = await c.req("POST", "/api/properties", {
    name: "Beach House",
    address: "1 Ocean Rd",
    city: "Byron Bay",
    state: "NSW",
    zip: "2481",
    type: "single_family",
  });
  if (p.status !== 201) throw new Error(`property ${p.status} ${p.text}`);
  const u = await c.req("POST", "/api/units", { propertyId: p.json.data.id, unitNumber: "A", rentAmount: 0 });
  if (u.status !== 201) throw new Error(`unit ${u.status} ${u.text}`);
  const l = await c.req("POST", "/api/str/listings", {
    unitId: u.json.data.id,
    name: "Beach House A",
    nightlyRate: 200,
    cleaningFee: 80,
    minStay: 2,
    ...overrides,
  });
  if (l.status !== 201) throw new Error(`listing ${l.status} ${l.text}`);
  return { propertyId: p.json.data.id as string, unitId: u.json.data.id as string, listing: l.json.data };
}
