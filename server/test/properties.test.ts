import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupDb, signUp } from "./helpers.js";

let close: () => Promise<void>;
beforeAll(async () => ({ close } = await setupDb()));
afterAll(async () => close());

describe("properties (long-term landlord features intact)", () => {
  it("creates, lists, updates and isolates properties per user", async () => {
    const a = await signUp();
    const b = await signUp();
    const created = await a.req("POST", "/api/properties", {
      name: "Elm St",
      address: "12 Elm St",
      city: "Sydney",
      state: "NSW",
      zip: "2000",
      type: "duplex",
      status: "vacant",
    });
    expect(created.status).toBe(201);
    const id = created.json.data.id;

    expect((await a.req("GET", "/api/properties")).json.data).toHaveLength(1);
    expect((await b.req("GET", "/api/properties")).json.data).toHaveLength(0);
    expect((await b.req("GET", `/api/properties/${id}`)).status).toBe(404);

    const upd = await a.req("PUT", `/api/properties/${id}`, { name: "Elm Street" });
    expect(upd.status).toBe(200);
    expect(upd.json.data.name).toBe("Elm Street");
    // Partial update must not reset fields to their schema defaults.
    expect(upd.json.data.status).toBe("vacant");

    expect((await a.req("POST", "/api/properties", { name: "" })).status).toBe(400);
  });
});
