import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  cookies: vi.fn(),
  getCookie: vi.fn(),
  merge: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  mergeAnonymousAchievementsIntoCurrentUser: mocks.merge,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: mocks.redirect,
  },
}));

import { GET } from "@/app/auth/callback/route";

const response = { redirected: true };

function request(query = "") {
  return new Request(`https://example.com/auth/callback${query}`);
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.createClient.mockResolvedValue({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
    },
  });
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.cookies.mockResolvedValue({ get: mocks.getCookie });
  mocks.getCookie.mockReturnValue(undefined);
  mocks.merge.mockResolvedValue({ migrated: 0, skipped: 0 });
  mocks.redirect.mockReturnValue(response);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("authentication callback", () => {
  it("redirects to login when no authorization code exists", async () => {
    await expect(GET(request())).resolves.toBe(response);

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/login?error=auth_callback_failed",
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.merge).not.toHaveBeenCalled();
  });

  it("redirects to login when session exchange reports an error", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    });

    await GET(request("?code=invalid"));

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith(
      "invalid",
    );
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/login?error=auth_callback_failed",
    );
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.merge).not.toHaveBeenCalled();
  });

  it("exchanges the code and redirects a normal login to the dashboard", async () => {
    await expect(GET(request("?code=valid-code"))).resolves.toBe(response);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith(
      "valid-code",
    );
    expect(mocks.getCookie).toHaveBeenCalledWith("anonymous_user_id");
    expect(mocks.merge).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/dashboard",
    );
  });

  it("handles password recovery before anonymous migration", async () => {
    mocks.getCookie.mockReturnValue({ value: "anonymous-1" });

    await GET(request("?code=valid-code&next=%2Freset-password"));

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/reset-password",
    );
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.merge).not.toHaveBeenCalled();
  });

  it("migrates anonymous achievements before redirecting", async () => {
    mocks.getCookie.mockReturnValue({ value: "anonymous-1" });

    await GET(request("?code=valid-code"));

    expect(mocks.merge).toHaveBeenCalledExactlyOnceWith("anonymous-1");
    expect(mocks.merge.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "https://example.com/dashboard",
    );
  });

  it("continues the login flow when anonymous migration fails", async () => {
    const error = new Error("Migration unavailable");
    mocks.getCookie.mockReturnValue({ value: "anonymous-1" });
    mocks.merge.mockRejectedValue(error);

    await expect(GET(request("?code=valid-code"))).resolves.toBe(response);

    expect(console.error).toHaveBeenCalledWith(
      "Anonymous achievement migration error:",
      error,
    );
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/dashboard",
    );
  });

  it.each([{ plan: "month" }, { plan: "year" }])(
    "preserves the $plan plan when returning to Pro",
    async ({ plan }) => {
      await GET(request(`?code=valid-code&next=%2Fpro&plan=${plan}`));

      const destination = mocks.redirect.mock.calls[0][0];

      expect(destination).toBeInstanceOf(URL);
      expect(destination.origin).toBe("https://example.com");
      expect(destination.pathname).toBe("/pro");
      expect(destination.searchParams.get("plan")).toBe(plan);
      expect(destination.searchParams.get("checkout")).toBe("1");
    },
  );

  it.each([
    { query: "&next=%2Fpro" },
    { query: "&next=%2Fpro&plan=invalid" },
    { query: "&next=%2Fdashboard&plan=month" },
    { query: "&next=https%3A%2F%2Fother.example.com" },
  ])(
    "uses the dashboard for unsupported return parameters $query",
    async ({ query }) => {
      await GET(request(`?code=valid-code${query}`));

      expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
        "https://example.com/dashboard",
      );
    },
  );

  it("still returns to the selected plan when migration fails", async () => {
    mocks.getCookie.mockReturnValue({ value: "anonymous-1" });
    mocks.merge.mockRejectedValue(new Error("Migration unavailable"));

    await GET(request("?code=valid-code&next=%2Fpro&plan=year"));

    const destination = mocks.redirect.mock.calls[0][0];

    expect(destination.pathname).toBe("/pro");
    expect(destination.searchParams.get("plan")).toBe("year");
    expect(destination.searchParams.get("checkout")).toBe("1");
  });

  it("propagates a rejected session exchange without redirecting", async () => {
    const error = new Error("Authentication unavailable");
    mocks.exchangeCodeForSession.mockRejectedValue(error);

    await expect(GET(request("?code=valid-code"))).rejects.toBe(error);

    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
