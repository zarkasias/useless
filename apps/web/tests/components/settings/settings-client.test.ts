// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  navbar: vi.fn(),
  subscription: vi.fn(),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/settings/profile-section", () => ({
  default: ({
    profile,
    email,
    onProfileUpdated,
  }: {
    profile: UserProfile;
    email: string;
    onProfileUpdated: (profile: UserProfile) => void;
  }) =>
    createElement(
      "section",
      { "data-testid": "profile" },
      createElement("span", null, profile.username),
      createElement("span", null, email),
      createElement(
        "button",
        {
          onClick: () =>
            onProfileUpdated({
              ...profile,
              username: "Updated Alice",
            }),
        },
        "Update profile",
      ),
    ),
}));

vi.mock("@/components/settings/subscription-section", () => ({
  default: (props: unknown) => {
    mocks.subscription(props);
    return createElement("section", null, "Subscription settings");
  },
}));

vi.mock("@/components/settings/delete-section", () => ({
  default: () => createElement("section", null, "Delete account settings"),
}));

import SettingsClient from "@/app/settings/settings_client";

type Props = Parameters<typeof SettingsClient>[0];

const profile: UserProfile = {
  id: "user-id",
  username: "Alice",
  role: "user",
  created_at: "2026-10-07T12:00:00.000Z",
  streak_count: 0,
};

const entitlements: Props["initialEntitlements"] = {
  achievementCount: 5,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 5,
  isSubscribed: true,
  subscriptionStatus: "active",
  billingInterval: "month",
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

let container: HTMLDivElement;
let root: Root;

async function render() {
  await act(async () => {
    root.render(
      createElement(SettingsClient, {
        initialProfile: profile,
        initialEntitlements: entitlements,
        email: "alice@example.com",
      }),
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
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

describe("SettingsClient", () => {
  it("renders settings sections and passes account information", async () => {
    await render();

    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("alice@example.com");
    expect(container.textContent).toContain("Subscription settings");
    expect(container.textContent).toContain("Delete account settings");

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });

    expect(mocks.subscription).toHaveBeenLastCalledWith({
      initialEntitlements: entitlements,
    });
  });

  it("updates the profile section and navbar after a profile change", async () => {
    await render();

    const button = container.querySelector("button");
    if (!button) throw new Error("Missing profile update button");

    await act(async () => {
      button.click();
    });

    expect(
      container.querySelector('[data-testid="profile"]')?.textContent,
    ).toContain("Updated Alice");

    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: { ...profile, username: "Updated Alice" },
      isSubscribed: true,
      subscriptionStatus: "active",
    });

    expect(profile.username).toBe("Alice");
  });
});
