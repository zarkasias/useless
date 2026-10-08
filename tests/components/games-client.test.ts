// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

vi.mock("@/components/games/game-card", () => ({
  default: ({
    title,
    available,
    subscribed,
  }: {
    title: string;
    available: boolean;
    subscribed: boolean;
  }) =>
    createElement(
      "button",
      {
        type: "button",
        "data-available": String(available),
        "data-subscribed": String(subscribed),
      },
      title,
    ),
}));

import GamesClient from "@/app/games/games-client";

let container: HTMLDivElement;
let root: Root;

const profile: UserProfile = {
  id: "user-1",
  username: "Player",
  role: "user",
  created_at: "2026-10-01T12:00:00.000Z",
  streak_count: 3,
};

const entitlements: UserEntitlements = {
  achievementCount: 3,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 7,
  isSubscribed: false,
  subscriptionStatus: null,
  billingInterval: null,
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

beforeEach(() => {
  mocks.push.mockReset();
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

async function render(isSubscribed: boolean) {
  await act(async () => {
    root.render(
      createElement(GamesClient, {
        initialProfile: profile,
        initialEntitlements: {
          ...entitlements,
          isSubscribed,
          subscriptionStatus: isSubscribed ? "active" : null,
        },
      }),
    );
  });
}

function card(title: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent === title,
  );

  if (!button) {
    throw new Error(`Missing game card: ${title}`);
  }

  return button;
}

const games = [
  { title: "Achievement Memory", path: "/games/memory" },
  { title: "Useless Solitaire", path: "/games/solitaire" },
  { title: "Useless Spider Solitaire", path: "/games/spider" },
];

describe("GamesClient", () => {
  it.each(games)("opens $title for subscribers", async ({ title, path }) => {
    await render(true);

    expect(card(title).getAttribute("data-available")).toBe("true");
    expect(card(title).getAttribute("data-subscribed")).toBe("true");

    await act(async () => {
      card(title).click();
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(path);
  });

  it.each(games)("does not open $title for free users", async ({ title }) => {
    await render(false);

    expect(card(title).getAttribute("data-subscribed")).toBe("false");

    await act(async () => {
      card(title).click();
    });

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it.each([{ isSubscribed: false }, { isSubscribed: true }])(
    "keeps Words unavailable when subscribed is $isSubscribed",
    async ({ isSubscribed }) => {
      await render(isSubscribed);

      const words = card("Useless Words");
      expect(words.getAttribute("data-available")).toBe("false");

      await act(async () => {
        words.click();
      });

      expect(mocks.push).not.toHaveBeenCalled();
    },
  );
});
