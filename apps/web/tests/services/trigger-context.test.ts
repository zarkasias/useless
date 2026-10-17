import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  adminClient: { marker: "mock-admin-client" },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

beforeEach(() => {
  vi.resetModules();
  mocks.createClient.mockReset();
  mocks.createClient.mockReturnValue(mocks.adminClient);

  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("trigger-context initialization", () => {
  it("creates the admin client with the configured credentials", async () => {
    const { supabaseAdmin } =
      await import("@/lib/services/utils/trigger-context");

    expect(mocks.createClient).toHaveBeenCalledExactlyOnceWith(
      "https://example.supabase.co",
      "test-service-key",
    );
    expect(supabaseAdmin).toBe(mocks.adminClient);
  });

  it("rejects a missing Supabase URL before creating a client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);

    await expect(
      import("@/lib/services/utils/trigger-context"),
    ).rejects.toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");

    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects a missing service role key before creating a client", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);

    await expect(
      import("@/lib/services/utils/trigger-context"),
    ).rejects.toThrow("Missing SUPABASE_SERVICE_ROLE_KEY");

    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("isFreeLimitError", () => {
  it("recognizes the exact free achievement limit error", async () => {
    const { isFreeLimitError } =
      await import("@/lib/services/utils/trigger-context");

    expect(
      isFreeLimitError({
        code: "23514",
        message: "Free achievement limit reached",
      }),
    ).toBe(true);
  });

  it.each([
    {
      name: "a different error code",
      error: {
        code: "23505",
        message: "Free achievement limit reached",
      },
    },
    {
      name: "a different error message",
      error: {
        code: "23514",
        message: "Another constraint failed",
      },
    },
    {
      name: "a missing code",
      error: {
        message: "Free achievement limit reached",
      },
    },
    {
      name: "a missing message",
      error: {
        code: "23514",
      },
    },
    {
      name: "an empty error",
      error: {},
    },
  ])("rejects $name", async ({ error }) => {
    const { isFreeLimitError } =
      await import("@/lib/services/utils/trigger-context");

    expect(isFreeLimitError(error)).toBe(false);
  });
});
