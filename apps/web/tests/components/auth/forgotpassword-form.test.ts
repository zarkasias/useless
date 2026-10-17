// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { resetPasswordForEmail: mocks.resetPassword },
  }),
}));

import { ForgotPasswordForm } from "@/components/auth/forgotpassword-form";

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  mocks.resetPassword.mockReset();
  mocks.resetPassword.mockResolvedValue({ error: null });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(createElement(ForgotPasswordForm));
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

async function enterEmail(value: string) {
  const input = container.querySelector<HTMLInputElement>("#email");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!input || !setter) {
    throw new Error("Missing email input or native setter");
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit() {
  const form = container.querySelector("form");

  if (!form) {
    throw new Error("Missing password recovery form");
  }

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

describe("ForgotPasswordForm", () => {
  it("renders a required email field and a return-to-login link", () => {
    const input = container.querySelector<HTMLInputElement>("#email");

    expect(input?.type).toBe("email");
    expect(input?.required).toBe(true);
    expect(input?.autocomplete).toBe("email");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/login");
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it("sends the entered email with the password-recovery callback URL", async () => {
    await enterEmail("player@example.com");
    await submit();

    expect(mocks.resetPassword).toHaveBeenCalledExactlyOnceWith(
      "player@example.com",
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );

    expect(container.textContent).toContain("Check your inbox");
    expect(container.textContent).toContain("player@example.com");
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/login");
  });

  it("shows reported service errors and keeps the form available", async () => {
    mocks.resetPassword.mockResolvedValue({
      error: { message: "Unable to send reset email" },
    });

    await enterEmail("player@example.com");
    await submit();

    expect(container.textContent).toContain("Unable to send reset email");
    expect(container.querySelector("form")).not.toBeNull();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });

  it("allows a successful retry after a reported failure", async () => {
    mocks.resetPassword
      .mockResolvedValueOnce({
        error: { message: "Please try again" },
      })
      .mockResolvedValueOnce({ error: null });

    await enterEmail("player@example.com");
    await submit();

    expect(container.textContent).toContain("Please try again");

    await submit();

    expect(mocks.resetPassword).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Check your inbox");
    expect(container.textContent).not.toContain("Please try again");
  });

  it("disables submission and clears the previous error while sending", async () => {
    mocks.resetPassword.mockResolvedValueOnce({
      error: { message: "First attempt failed" },
    });

    await enterEmail("player@example.com");
    await submit();

    let finish!: (value: { error: null }) => void;
    mocks.resetPassword.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    await submit();

    expect(container.textContent).toContain("Sending reset link...");
    expect(container.textContent).not.toContain("First attempt failed");
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(true);

    await act(async () => {
      finish({ error: null });
    });

    expect(container.textContent).toContain("Check your inbox");
  });
});
