// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
  signupForm: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/components/auth/signup-form", () => ({
  SignupForm: () => {
    mocks.signupForm();
    return createElement("form", { "data-testid": "signup-form" });
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

import SignupPage from "@/app/signup/page";

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

async function render(): Promise<HTMLDivElement> {
  const element = await SignupPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("SignupPage", () => {
  it("renders the signup form and guest navbar", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "Start collecting useless greatness.",
    );
    expect(
      container.querySelector('[data-testid="signup-form"]'),
    ).not.toBeNull();

    expect(mocks.createClient).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.signupForm).toHaveBeenCalledTimes(1);
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({ user: null });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("renders signup guidance and descriptive trophy artwork", async () => {
    const container = await render();

    expect(container.textContent).toContain("Your first ten are free");
    expect(container.textContent).toContain(
      "Serious accomplishments are absolutely not required.",
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/icons/golden_trophy.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Useless Achievements trophy",
    );
  });

  it("redirects authenticated users before rendering the signup form", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    await expect(render()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/dashboard");
    expect(mocks.signupForm).not.toHaveBeenCalled();
    expect(mocks.navbar).not.toHaveBeenCalled();
  });

  it("propagates client initialization failures", async () => {
    const error = new Error("Supabase initialization failed");
    mocks.createClient.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.signupForm).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication request failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.signupForm).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
