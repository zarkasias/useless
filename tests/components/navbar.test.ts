// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/lib/auth-actions", () => ({
  logout: mocks.logout,
}));

vi.mock("@/components/notifications/notification-center", () => ({
  NotificationCenter: () => null,
}));

import { Navbar } from "@/components/navbar";

let container: HTMLDivElement;
let root: Root;

const user: UserProfile = {
  id: "user-1",
  username: "Player",
  role: "user",
  created_at: "2026-10-01T12:00:00.000Z",
  streak_count: 3,
};

beforeEach(() => {
  mocks.pathname = "/dashboard";
  mocks.logout.mockReset();
  mocks.logout.mockResolvedValue(undefined);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

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

async function render(overrides: Partial<Parameters<typeof Navbar>[0]> = {}) {
  await act(async () => {
    root.render(createElement(Navbar, { user, ...overrides }));
  });
}

async function openMenu() {
  const trigger = container.querySelector<HTMLElement>(
    '[data-slot="dropdown-menu-trigger"]',
  );

  if (!trigger) {
    throw new Error("Missing account menu trigger");
  }

  await act(async () => {
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

describe("Navbar", () => {
  it("shows login and signup links for signed-out visitors", async () => {
    await render({ user: null });

    expect(container.querySelector('a[href="/login"]')?.textContent).toBe(
      "Login",
    );
    expect(container.querySelector('a[href="/signup"]')?.textContent).toBe(
      "Sign Up",
    );
    expect(container.querySelector('a[href="/dashboard"]')).toBeNull();
  });

  it.each([
    {
      isSubscribed: false,
      subscriptionStatus: null,
      label: "Subscribe",
    },
    {
      isSubscribed: true,
      subscriptionStatus: "active",
      label: "Subscription",
    },
    {
      isSubscribed: true,
      subscriptionStatus: "past_due",
      label: "Billing issue",
    },
  ])(
    "shows the $label subscription action",
    async ({ isSubscribed, subscriptionStatus, label }) => {
      await render({ isSubscribed, subscriptionStatus });

      expect(container.querySelector('a[href="/pro"]')?.textContent).toContain(
        label,
      );
    },
  );

  it.each([
    { pathname: "/dashboard", href: "/dashboard" },
    { pathname: "/collection/example", href: "/collection" },
    { pathname: "/games/spider", href: "/games" },
    { pathname: "/profile/Alice", href: "/leaderboard" },
    { pathname: "/leaderboard", href: "/leaderboard" },
    { pathname: "/packs/example", href: "/packs" },
  ])("highlights $href on $pathname", async ({ pathname, href }) => {
    mocks.pathname = pathname;
    await render();

    const button = container.querySelector(`a[href="${href}"] button`);

    expect(button?.classList.contains("bg-primary/10")).toBe(true);
  });

  it.each([{ pathname: "/pro" }, { pathname: "/pro/details" }])(
    "recognizes the Pro section at $pathname",
    async ({ pathname }) => {
      mocks.pathname = pathname;
      await render();

      expect(
        container
          .querySelector('a[href="/pro"] button')
          ?.classList.contains("bg-muted"),
      ).toBe(true);
    },
  );

  it.each([
    { role: "user" as const, hasAdmin: false },
    { role: "admin" as const, hasAdmin: true },
  ])(
    "shows admin navigation only for role $role",
    async ({ role, hasAdmin }) => {
      await render({ user: { ...user, role } });
      await openMenu();

      expect(document.querySelector('a[href="/admin"]') !== null).toBe(
        hasAdmin,
      );
      expect(
        document.querySelector('a[href="/profile/Player"]'),
      ).not.toBeNull();
      expect(document.querySelector('a[href="/settings"]')).not.toBeNull();
    },
  );

  it("logs out through the account menu", async () => {
    await render();
    await openMenu();

    const logout = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ).find((element) => element.textContent?.trim() === "Logout");

    if (!logout) {
      throw new Error("Missing Logout menu item");
    }

    await act(async () => {
      logout.click();
    });

    expect(mocks.logout).toHaveBeenCalledExactlyOnceWith();
  });
});
