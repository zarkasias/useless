// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
  loginForm: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/components/auth/login-form", () => ({
  LoginForm: (props: unknown) => {
    mocks.loginForm(props);
    return null;
  },
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/utils/background", () => ({
  default: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import LoginPage from "@/app/login/page";

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
  });
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

async function render(next?: string): Promise<HTMLDivElement> {
  const element = await LoginPage({
    searchParams: Promise.resolve({ next }),
  });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("LoginPage", () => {
  it("renders the guest login page with the default return destination", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "Resume accomplishing nothing.",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Useless Achievements trophy",
    );
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({ user: null });
    expect(mocks.loginForm).toHaveBeenCalledExactlyOnceWith({
      redirectTo: "/dashboard",
    });
    expect(mocks.createClient).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("passes a safe internal return URL to the login form", async () => {
    await render("/games/spider?mode=easy");

    expect(mocks.loginForm).toHaveBeenCalledExactlyOnceWith({
      redirectTo: "/games/spider?mode=easy",
    });
  });

  it.each(["https://example.com", "//example.com", "/\\example.com"])(
    "replaces an unsafe return URL: %s",
    async (next) => {
      await render(next);

      expect(mocks.loginForm).toHaveBeenCalledExactlyOnceWith({
        redirectTo: "/dashboard",
      });
    },
  );

  it("redirects an authenticated user to the requested internal page", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    await expect(render("/games/spider")).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/games/spider");
    expect(mocks.loginForm).not.toHaveBeenCalled();
    expect(mocks.navbar).not.toHaveBeenCalled();
  });

  it("redirects an authenticated user to the fallback for an unsafe URL", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    await expect(render("https://example.com")).rejects.toThrow(
      "TEST_REDIRECT",
    );

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/dashboard");
  });

  it("propagates client initialization failures", async () => {
    const error = new Error("Supabase initialization failed");
    mocks.createClient.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication request failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.loginForm).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
