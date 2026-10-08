import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  next: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: mocks.next,
  },
}));

import { updateSession } from "@/lib/supabase/middleware";

function makeRequest() {
  return {
    cookies: {
      getAll: vi.fn(),
      set: vi.fn(),
    },
  };
}

function makeResponse() {
  return {
    cookies: {
      set: vi.fn(),
    },
  };
}

beforeEach(() => {
  mocks.createServerClient.mockReset();
  mocks.getUser.mockReset();
  mocks.next.mockReset();

  mocks.createServerClient.mockReturnValue({
    auth: { getUser: mocks.getUser },
  });

  mocks.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
});

describe("updateSession", () => {
  it("checks authentication and returns the initial response", async () => {
    const request = makeRequest();
    const response = makeResponse();
    mocks.next.mockReturnValue(response);

    await expect(
      updateSession(request as unknown as NextRequest),
    ).resolves.toBe(response);

    expect(mocks.next).toHaveBeenCalledExactlyOnceWith({ request });
    expect(mocks.getUser).toHaveBeenCalledOnce();
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

  it("reads cookies from the incoming request", async () => {
    const request = makeRequest();
    const cookies = [{ name: "session", value: "existing-session" }];
    request.cookies.getAll.mockReturnValue(cookies);
    mocks.next.mockReturnValue(makeResponse());

    await updateSession(request as unknown as NextRequest);

    const options = mocks.createServerClient.mock.calls[0][2];

    expect(options.cookies.getAll()).toBe(cookies);
    expect(request.cookies.getAll).toHaveBeenCalledOnce();
  });

  it("forwards refreshed cookies and returns the replacement response", async () => {
    const request = makeRequest();
    const initialResponse = makeResponse();
    const refreshedResponse = makeResponse();

    mocks.next
      .mockReturnValueOnce(initialResponse)
      .mockReturnValueOnce(refreshedResponse);

    const sessionOptions = { httpOnly: true, path: "/" };
    const refreshOptions = { secure: true, maxAge: 3600 };

    mocks.getUser.mockImplementation(async () => {
      const options = mocks.createServerClient.mock.calls[0][2];

      options.cookies.setAll([
        {
          name: "session",
          value: "new-session",
          options: sessionOptions,
        },
        {
          name: "refresh",
          value: "new-refresh",
          options: refreshOptions,
        },
      ]);

      return { data: { user: { id: "user-1" } }, error: null };
    });

    await expect(
      updateSession(request as unknown as NextRequest),
    ).resolves.toBe(refreshedResponse);

    expect(request.cookies.set).toHaveBeenCalledTimes(2);
    expect(request.cookies.set).toHaveBeenNthCalledWith(
      1,
      "session",
      "new-session",
    );
    expect(request.cookies.set).toHaveBeenNthCalledWith(
      2,
      "refresh",
      "new-refresh",
    );

    expect(mocks.next).toHaveBeenCalledTimes(2);
    expect(mocks.next).toHaveBeenNthCalledWith(2, { request });

    expect(refreshedResponse.cookies.set).toHaveBeenCalledTimes(2);
    expect(refreshedResponse.cookies.set).toHaveBeenNthCalledWith(
      1,
      "session",
      "new-session",
      sessionOptions,
    );
    expect(refreshedResponse.cookies.set).toHaveBeenNthCalledWith(
      2,
      "refresh",
      "new-refresh",
      refreshOptions,
    );
    expect(initialResponse.cookies.set).not.toHaveBeenCalled();
  });

  it("returns the response when authentication reports an error", async () => {
    const request = makeRequest();
    const response = makeResponse();
    mocks.next.mockReturnValue(response);

    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Session expired" },
    });

    await expect(
      updateSession(request as unknown as NextRequest),
    ).resolves.toBe(response);
  });

  it("waits for authentication before completing", async () => {
    const request = makeRequest();
    const response = makeResponse();
    mocks.next.mockReturnValue(response);

    let finishAuthentication!: () => void;
    mocks.getUser.mockReturnValue(
      new Promise<void>((resolve) => {
        finishAuthentication = resolve;
      }),
    );

    let completed = false;
    const pending = updateSession(request as unknown as NextRequest).then(
      (result) => {
        completed = true;
        return result;
      },
    );

    await Promise.resolve();
    expect(completed).toBe(false);

    finishAuthentication();

    await expect(pending).resolves.toBe(response);
    expect(completed).toBe(true);
  });

  it("propagates a rejected authentication request", async () => {
    const request = makeRequest();
    mocks.next.mockReturnValue(makeResponse());
    mocks.getUser.mockRejectedValue(new Error("Authentication unavailable"));

    await expect(
      updateSession(request as unknown as NextRequest),
    ).rejects.toThrow("Authentication unavailable");
  });
});
