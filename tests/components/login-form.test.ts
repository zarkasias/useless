// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  migrate: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  query: "",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mocks.signIn },
  }),
}));

vi.mock("@/app/actions/achievement-actions", () => ({
  migrateAnonymousAchievementsAction: mocks.migrate,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(mocks.query),
}));

import { LoginForm } from "@/components/auth/login-form";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.signIn.mockReset();
  mocks.migrate.mockReset();
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  mocks.query = "";

  mocks.signIn.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mocks.migrate.mockResolvedValue({ migrated: 0, skipped: 0 });

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

async function render(redirectTo?: string) {
  await act(async () => {
    root.render(createElement(LoginForm, { redirectTo }));
  });
}

async function enter(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(selector);
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!input || !setter) {
    throw new Error(`Missing input: ${selector}`);
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit(email = "player@example.com", password = "password123") {
  await enter('input[name="email"]', email);
  await enter('input[name="password"]', password);

  const form = container.querySelector("form");

  if (!form) {
    throw new Error("Missing login form");
  }

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

describe("LoginForm", () => {
  it("rejects invalid credentials before contacting authentication", async () => {
    await render();
    await submit("not-an-email", "short");

    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[aria-invalid="true"]').length).toBe(2);
  });

  it("authenticates, migrates achievements, and opens the dashboard", async () => {
    await render();
    await submit();

    expect(mocks.signIn).toHaveBeenCalledExactlyOnceWith({
      email: "player@example.com",
      password: "password123",
    });
    expect(mocks.migrate).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("You're in!");
  });

  it("uses the supplied default destination", async () => {
    await render("/collection");
    await submit();

    expect(mocks.push).toHaveBeenCalledWith("/collection");
  });

  it("prefers the next query parameter over the default destination", async () => {
    mocks.query = "next=%2Fpro&plan=year";
    await render("/collection");

    const signup = container.querySelector("a");
    expect(signup?.getAttribute("href")).toBe("/signup?next=%2Fpro&plan=year");

    await submit();

    expect(mocks.push).toHaveBeenCalledWith("/pro");
  });

  it("uses the plain signup link when no query parameters exist", async () => {
    await render();

    expect(container.querySelector("a")?.getAttribute("href")).toBe("/signup");
  });

  it("displays authentication errors and allows another attempt", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    await render();
    await submit();

    expect(container.textContent).toContain("Invalid login credentials");
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });

  it("handles successful responses without a user", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    await render();
    await submit();

    expect(container.textContent).toContain("Unable to log in");
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("continues login when anonymous migration fails", async () => {
    const error = new Error("Migration unavailable");
    mocks.migrate.mockRejectedValue(error);
    await render();
    await submit();

    expect(console.error).toHaveBeenCalledWith(
      "Anonymous achievement migration error:",
      error,
    );
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("handles rejected authentication requests", async () => {
    const error = new Error("Authentication unavailable");
    mocks.signIn.mockRejectedValue(error);
    await render();
    await submit();

    expect(console.error).toHaveBeenCalledWith("Login error:", error);
    expect(container.textContent).toContain("An unexpected error occurred");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("disables fields while authentication is pending", async () => {
    let finish!: (value: unknown) => void;
    mocks.signIn.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    await submit();

    expect(container.textContent).toContain("Logging in...");
    expect(
      container.querySelector<HTMLInputElement>('input[name="email"]')
        ?.disabled,
    ).toBe(true);
    expect(
      container.querySelector<HTMLInputElement>('input[name="password"]')
        ?.disabled,
    ).toBe(true);

    await act(async () => {
      finish({
        data: { user: null },
        error: { message: "Please try again" },
      });
    });

    expect(
      container.querySelector<HTMLInputElement>('input[name="email"]')
        ?.disabled,
    ).toBe(false);
  });

  it("navigates to password recovery", async () => {
    await render();

    const button = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === "Forgot password?",
    );

    if (!button) {
      throw new Error("Missing password recovery button");
    }

    await act(async () => {
      button.click();
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/forgot-password");
  });
});
