import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: mocks.updateSession,
}));

import { middleware } from "@/middleware";

beforeEach(() => {
  mocks.updateSession.mockReset();
});

describe("middleware", () => {
  it("forwards the original request and returns the session response", async () => {
    const request = new NextRequest("https://example.com/dashboard");
    const response = NextResponse.next();
    response.cookies.set("session", "refreshed-session");

    mocks.updateSession.mockResolvedValue(response);

    const result = await middleware(request);

    expect(mocks.updateSession).toHaveBeenCalledExactlyOnceWith(request);
    expect(result).toBe(response);
    expect(result.cookies.get("session")?.value).toBe("refreshed-session");
  });

  it("propagates session update failures", async () => {
    const request = new NextRequest("https://example.com/dashboard");
    const error = new Error("Session service unavailable");

    mocks.updateSession.mockRejectedValue(error);

    await expect(middleware(request)).rejects.toBe(error);
    expect(mocks.updateSession).toHaveBeenCalledExactlyOnceWith(request);
  });
});
