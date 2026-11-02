import { describe, expect, it, vi } from "vitest";
import { completeAuthRedirect } from "./post-auth";

describe("completeAuthRedirect", () => {
  it("navigates once the server confirms the session", async () => {
    const navigate = vi.fn();
    const getSession = vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } });
    expect(await completeAuthRedirect({ getSession, navigate })).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("retries while the session is not visible yet (the sign-in-twice bug)", async () => {
    const navigate = vi.fn();
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({ data: null })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ data: { user: { id: "u1" } } });
    expect(await completeAuthRedirect({ getSession, navigate, delayMs: 1 })).toBe(true);
    expect(getSession).toHaveBeenCalledTimes(3);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("does not navigate if no session ever appears", async () => {
    const navigate = vi.fn();
    const getSession = vi.fn().mockResolvedValue({ data: null });
    expect(await completeAuthRedirect({ getSession, navigate, retries: 2, delayMs: 1 })).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
