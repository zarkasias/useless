import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { logout } from "@/lib/auth-actions";

beforeEach(() => {
  mocks.createClient.mockReset();
  mocks.signOut.mockReset();
  mocks.redirect.mockReset();

  mocks.createClient.mockResolvedValue({
    auth: { signOut: mocks.signOut },
  });
  mocks.signOut.mockResolvedValue({ error: null });

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("logout", () => {
  it("signs out before redirecting to the home page", async () => {
    const redirectSignal = new Error("Redirect");
    mocks.redirect.mockImplementation(() => {
      throw redirectSignal;
    });

    await expect(logout()).rejects.toBe(redirectSignal);

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
  });

  it("logs a sign-out error and throws without redirecting", async () => {
    const error = { message: "Sign-out failed" };
    mocks.signOut.mockResolvedValue({ error });

    await expect(logout()).rejects.toThrow("Unable to log out");

    expect(console.error).toHaveBeenCalledWith("Logout error:", error);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates a rejected client initialization", async () => {
    mocks.createClient.mockRejectedValue(
      new Error("Client initialization failed"),
    );

    await expect(logout()).rejects.toThrow("Client initialization failed");

    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates a rejected sign-out request", async () => {
    mocks.signOut.mockRejectedValue(new Error("Authentication unavailable"));

    await expect(logout()).rejects.toThrow("Authentication unavailable");

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
