// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  migrate: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: mocks.signUp },
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
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

import { SignupForm } from "@/components/auth/signup-form";

let container: HTMLDivElement;
let root: Root;
let originalUrl: string;

beforeEach(() => {
  mocks.signUp.mockReset();
  mocks.migrate.mockReset();
  mocks.push.mockReset();
  mocks.refresh.mockReset();

  mocks.signUp.mockResolvedValue({
    data: { user: { id: "user-1" }, session: null },
    error: null,
  });
  mocks.migrate.mockResolvedValue({ migrated: 0, skipped: 0 });

  originalUrl = window.location.href;
  window.history.replaceState({}, "", "/signup");

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
  window.history.replaceState({}, "", originalUrl);
  vi.unstubAllGlobals();
});

async function render(query = "") {
  window.history.replaceState({}, "", `/signup${query}`);

  await act(async () => {
    root.render(createElement(SignupForm));
  });
}

async function enter(name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(
    `input[name="${name}"]`,
  );
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!input || !setter) {
    throw new Error(`Missing input: ${name}`);
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit(overrides: Record<string, string> = {}) {
  for (const [name, value] of Object.entries({
    username: "Player",
    email: "player@example.com",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  })) {
    await enter(name, value);
  }

  const form = container.querySelector("form");

  if (!form) {
    throw new Error("Missing signup form");
  }

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

describe("SignupForm", () => {
  it("submits account details and shows email confirmation", async () => {
    await render();
    await submit();

    expect(mocks.signUp).toHaveBeenCalledExactlyOnceWith({
      email: "player@example.com",
      password: "password123",
      options: {
        data: { username: "Player" },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard`,
      },
    });
    expect(container.textContent).toContain("Check your email");
    expect(container.textContent).toContain("player@example.com");
    expect(container.querySelector("form")).toBeNull();
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();

    const back = container.querySelector("button");

    await act(async () => {
      back?.click();
    });

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });

  it.each([
    { field: "username", value: "ab" },
    { field: "username", value: "a".repeat(21) },
    { field: "email", value: "invalid" },
    { field: "password", value: "short" },
    { field: "confirmPassword", value: "different-password" },
  ])(
    "rejects invalid $field before contacting signup",
    async ({ field, value }) => {
      await render();
      await submit({ [field]: value });

      expect(mocks.signUp).not.toHaveBeenCalled();
      expect(container.querySelector('[aria-invalid="true"]')).not.toBeNull();
    },
  );

  it("migrates and opens the dashboard when signup creates a session", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "test" } },
      error: null,
    });
    await render();
    await submit();

    expect(mocks.migrate).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/dashboard");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("Account created!");
  });

  it.each([{ plan: "month" }, { plan: "year" }])(
    "preserves the $plan subscription flow",
    async ({ plan }) => {
      mocks.signUp.mockResolvedValue({
        data: { user: { id: "user-1" }, session: { access_token: "test" } },
        error: null,
      });
      await render(`?next=%2Fpro&plan=${plan}`);

      expect(container.querySelector("a")?.getAttribute("href")).toBe(
        `/login?next=%2Fpro&plan=${plan}`,
      );

      await submit();

      const callback = new URL(
        mocks.signUp.mock.calls[0][0].options.emailRedirectTo,
      );

      expect(callback.searchParams.get("next")).toBe("/pro");
      expect(callback.searchParams.get("plan")).toBe(plan);
      expect(callback.searchParams.get("checkout")).toBe("1");
      expect(mocks.push).toHaveBeenCalledWith(`/pro?plan=${plan}&checkout=1`);
    },
  );

  it("omits unsupported plans from the confirmation callback", async () => {
    await render("?next=%2Fcollection&plan=invalid");
    await submit();

    const callback = new URL(
      mocks.signUp.mock.calls[0][0].options.emailRedirectTo,
    );

    expect(callback.searchParams.get("next")).toBe("/collection");
    expect(callback.searchParams.has("plan")).toBe(false);
    expect(callback.searchParams.has("checkout")).toBe(false);
  });

  it("continues signup when migration fails", async () => {
    const error = new Error("Migration unavailable");
    mocks.signUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "test" } },
      error: null,
    });
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

  it.each([
    {
      label: "rate-limit code",
      error: {
        code: "over_email_send_rate_limit",
        message: "Rate limited",
      },
      expected:
        "Too many confirmation emails have been sent. Please wait a little while and try again.",
    },
    {
      label: "HTTP 429",
      error: { status: 429, message: "Rate limited" },
      expected:
        "Too many confirmation emails have been sent. Please wait a little while and try again.",
    },
    {
      label: "ordinary error",
      error: { message: "Registration unavailable" },
      expected: "Registration unavailable",
    },
  ])("handles a $label", async ({ error, expected }) => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error,
    });
    await render();
    await submit();

    expect(container.textContent).toContain(expected);
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });

  it("handles a response without a user", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    await render();
    await submit();

    expect(container.textContent).toContain("Unable to create account");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("handles rejected signup requests", async () => {
    const error = new Error("Network unavailable");
    mocks.signUp.mockRejectedValue(error);
    await render();
    await submit();

    expect(console.error).toHaveBeenCalledWith("Signup error:", error);
    expect(container.textContent).toContain("An unexpected error occurred");
  });

  it("disables the form while creating the account", async () => {
    let finish!: (value: unknown) => void;
    mocks.signUp.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    await submit();

    expect(container.textContent).toContain("Creating account...");
    expect(
      Array.from(container.querySelectorAll("input")).every(
        (input) => input.disabled,
      ),
    ).toBe(true);

    await act(async () => {
      finish({
        data: { user: { id: "user-1" }, session: null },
        error: null,
      });
    });

    expect(container.textContent).toContain("Check your email");
  });
});
