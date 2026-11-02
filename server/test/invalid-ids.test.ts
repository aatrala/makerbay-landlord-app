import { beforeAll, describe, expect, it } from "vitest";
import { setupDb, signUp, type Client } from "./helpers";

describe("malformed ids", () => {
  let host: Client;
  beforeAll(async () => {
    await setupDb();
    host = await signUp();
  });

  it("returns 404 (not 500) when sending a message with an invalid id", async () => {
    const r = await host.req("POST", "/api/str/messages/null/send");
    expect(r.status).toBe(404);
    expect(r.json.code).toBe("NOT_FOUND");
  });

  it("returns 404 for a valid but unknown message id", async () => {
    const r = await host.req("POST", "/api/str/messages/00000000-0000-4000-8000-000000000000/send");
    expect(r.status).toBe(404);
  });

  it("returns 404 for other routes given a malformed id", async () => {
    const r = await host.req("GET", "/api/str/listings/not-a-uuid");
    expect(r.status).toBe(404);
  });
});
