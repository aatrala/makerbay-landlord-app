import { describe, expect, it, vi } from "vitest";
import { parseStripeReturn, waitForReceived } from "./stripe-return";

describe("parseStripeReturn", () => {
  it("parses success / processing / failure", () => {
    expect(parseStripeReturn("?pay=p1&payment_intent=pi_1&redirect_status=succeeded")).toEqual({ paymentId: "p1", outcome: "succeeded" });
    expect(parseStripeReturn("?pay=p1&payment_intent=pi_1&redirect_status=processing")?.outcome).toBe("processing");
    expect(parseStripeReturn("?pay=p1&payment_intent=pi_1&redirect_status=failed")?.outcome).toBe("failed");
  });
  it("ignores unrelated urls", () => {
    expect(parseStripeReturn("")).toBeNull();
    expect(parseStripeReturn("?pay=p1")).toBeNull();
  });
});

describe("waitForReceived", () => {
  it("resolves once the webhook has marked the payment received", async () => {
    const check = vi.fn().mockResolvedValueOnce("pending").mockResolvedValueOnce("received");
    expect(await waitForReceived(check, { delayMs: 1 })).toBe("received");
    expect(check).toHaveBeenCalledTimes(2);
  });
  it("times out while still pending", async () => {
    const check = vi.fn().mockResolvedValue("pending");
    expect(await waitForReceived(check, { attempts: 3, delayMs: 1 })).toBe("timeout");
  });
});
