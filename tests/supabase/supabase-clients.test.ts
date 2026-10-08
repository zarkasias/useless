import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
  cookies: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mocks.createBrowserClient,
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

beforeEach(() => {
  mocks.createBrowserClient.mockReset();
  mocks.createServerClient.mockReset();
  mocks.cookies.mockReset();
  mocks.getAll.mockReset();
  mocks.set.mockReset();

  mocks.cookies.mockResolvedValue({
    getAll: mocks.getAll,
    set: mocks.set,
  });
});

describe("Supabase browser client", () => {
  it("creates and returns the browser client using the configured credentials", () => {
    const client = { auth: { getUser: vi.fn() } };
    mocks.createBrowserClient.mockReturnValue(client);

    expect(createBrowserClient()).toBe(client);

    expect(mocks.createBrowserClient).toHaveBeenCalledExactlyOnceWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  it("propagates browser client initialization errors", () => {
    mocks.createBrowserClient.mockImplementation(() => {
      throw new Error("Browser initialization failed");
    });

    expect(() => createBrowserClient()).toThrow(
      "Browser initialization failed",
    );
  });
});

describe("Supabase server client", () => {
  it("creates and returns the server client with cookie adapters", async () => {
    const client = { auth: { getUser: vi.fn() } };
    mocks.createServerClient.mockReturnValue(client);

    await expect(createServerClient()).resolves.toBe(client);

    expect(mocks.cookies).toHaveBeenCalledOnce();
    expect(mocks.createServerClient).toHaveBeenCalledExactlyOnceWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        },
      },
    );
  });

  it("reads cookies from the request cookie store", async () => {
    const cookies = [{ name: "session", value: "session-value" }];
    mocks.getAll.mockReturnValue(cookies);

    await createServerClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    expect(options.cookies.getAll()).toBe(cookies);
    expect(mocks.getAll).toHaveBeenCalledOnce();
  });

  it("writes every cookie with its supplied options", async () => {
    await createServerClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    const firstOptions = { httpOnly: true, path: "/" };
    const secondOptions = { secure: true, maxAge: 3600 };

    options.cookies.setAll([
      {
        name: "session",
        value: "session-value",
        options: firstOptions,
      },
      {
        name: "refresh",
        value: "refresh-value",
        options: secondOptions,
      },
    ]);

    expect(mocks.set).toHaveBeenCalledTimes(2);
    expect(mocks.set).toHaveBeenNthCalledWith(
      1,
      "session",
      "session-value",
      firstOptions,
    );
    expect(mocks.set).toHaveBeenNthCalledWith(
      2,
      "refresh",
      "refresh-value",
      secondOptions,
    );
  });

  it("does not write cookies when the supplied list is empty", async () => {
    await createServerClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    options.cookies.setAll([]);

    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("tolerates cookie writes in a read-only server context", async () => {
    mocks.set.mockImplementation(() => {
      throw new Error("Cookies are read-only");
    });

    await createServerClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    expect(() =>
      options.cookies.setAll([
        {
          name: "session",
          value: "session-value",
          options: { path: "/" },
        },
      ]),
    ).not.toThrow();

    expect(mocks.set).toHaveBeenCalledOnce();
  });

  it("propagates errors while obtaining the cookie store", async () => {
    mocks.cookies.mockRejectedValue(new Error("Cookie store unavailable"));

    await expect(createServerClient()).rejects.toThrow(
      "Cookie store unavailable",
    );

    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("propagates server client initialization errors", async () => {
    mocks.createServerClient.mockImplementation(() => {
      throw new Error("Server initialization failed");
    });

    await expect(createServerClient()).rejects.toThrow(
      "Server initialization failed",
    );
  });
});
