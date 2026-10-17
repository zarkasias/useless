// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
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

vi.mock("@/components/auth/forgotpassword-form", () => ({
  ForgotPasswordForm: () =>
    createElement("form", { "data-testid": "forgot-password-form" }),
}));

vi.mock("@/components/auth/resetpassword-form", () => ({
  ResetPasswordForm: () =>
    createElement("form", { "data-testid": "reset-password-form" }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import ForgotPasswordPage from "@/app/forgot-password/page";
import ResetPasswordPage from "@/app/reset-password/page";

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

function markup(element: React.ReactElement): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("ForgotPasswordPage", () => {
  it("renders the recovery form and guest navbar", async () => {
    const container = markup(await ForgotPasswordPage());

    expect(container.querySelector("h1")?.textContent).toBe(
      "Forgot your password?",
    );
    expect(
      container.querySelector('[data-testid="forgot-password-form"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain(
      "Enter your email and we'll send you a link to create a new one.",
    );
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({ user: null });
    expect(mocks.createClient).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to the dashboard", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    await expect(ForgotPasswordPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/dashboard");
    expect(mocks.navbar).not.toHaveBeenCalled();
  });

  it("propagates client initialization failures", async () => {
    const error = new Error("Client initialization failed");
    mocks.createClient.mockRejectedValue(error);

    await expect(ForgotPasswordPage()).rejects.toBe(error);

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication request failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(ForgotPasswordPage()).rejects.toBe(error);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordPage", () => {
  it("renders the reset form and guidance without checking authentication", () => {
    const container = markup(createElement(ResetPasswordPage));

    expect(container.querySelector("h1")?.textContent).toBe(
      "Choose a new password.",
    );
    expect(
      container.querySelector('[data-testid="reset-password-form"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("New password unlocked");
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({ user: null });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("renders descriptive trophy artwork", () => {
    const container = markup(createElement(ResetPasswordPage));

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/icons/golden_trophy.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Useless Achievements trophy",
    );
  });
});
