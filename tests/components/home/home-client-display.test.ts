// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navbar: vi.fn(),
  promo: vi.fn(),
  feature: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/actions/achievement-actions", () => ({
  claimDailyAchievementAction: vi.fn(),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/packs/featured-pack-promo", () => ({
  FeaturedPackPromo: (props: unknown) => {
    mocks.promo(props);
    return null;
  },
}));

vi.mock("@/components/feature-card", () => ({
  FeatureCard: (props: unknown) => {
    mocks.feature(props);
    return null;
  },
}));

vi.mock("@/components/unlock-achievement", () => ({
  UnlockAchievement: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import HomeClient from "@/app/home/home-client";

type Props = Parameters<typeof HomeClient>[0];
type Pack = Props["initialPacks"][number];

const profile: NonNullable<Props["initialProfile"]> = {
  id: "user-1",
  username: "Alice",
  role: "user",
  created_at: "2026-10-08T12:00:00.000Z",
  streak_count: 3,
};

const entitlements: NonNullable<Props["initialEntitlements"]> = {
  achievementCount: 5,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 5,
  isSubscribed: true,
  subscriptionStatus: "active",
  billingInterval: "month",
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

function pack(overrides: Partial<Pack> = {}): Pack {
  return {
    id: "active-1",
    name: "Internet Habits",
    slug: "internet-habits",
    description: null,
    price_cents: 299,
    currency: "usd",
    starts_at: null,
    ends_at: null,
    cover_image_path: null,
    theme_key: "default",
    status: "active",
    isUpcoming: false,
    owned: false,
    availableForPurchase: true,
    hasEnded: false,
    totalAchievements: 10,
    collectedAchievements: 0,
    completed: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function render(overrides: Partial<Props> = {}): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(HomeClient, {
      initialProfile: null,
      initialEntitlements: null,
      initialPacks: [],
      ...overrides,
    }),
  );
  return container;
}

describe("HomeClient display", () => {
  it("shows guest navigation and default navbar subscription values", () => {
    const container = render();

    expect(
      container.querySelector('a[href="/signup?next=/games"]'),
    ).not.toBeNull();
    expect(container.querySelector('a[href="/signup"]')).not.toBeNull();
    expect(container.querySelector('a[href="/collection"]')).toBeNull();
    expect(container.querySelector('a[href="/pro"]')?.textContent).toBe(
      "View subscription plans",
    );
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: null,
      isSubscribed: false,
      subscriptionStatus: null,
    });
  });

  it("shows signed-in navigation and subscription details", () => {
    const container = render({
      initialProfile: profile,
      initialEntitlements: entitlements,
    });

    expect(container.querySelector('a[href="/games"]')).not.toBeNull();
    expect(container.querySelector('a[href="/collection"]')?.textContent).toBe(
      "See my ridiculous collection",
    );
    expect(container.querySelector('a[href="/signup"]')).toBeNull();
    expect(container.querySelector('a[href="/pro"]')?.textContent).toBe(
      "View subscription",
    );
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("renders all five feature variants", () => {
    render();

    expect(mocks.feature.mock.calls.map(([props]) => props.variant)).toEqual([
      "games",
      "daily",
      "streak",
      "collection",
      "leaderboard",
    ]);
  });

  it("renders the hero artwork with descriptive alternative text", () => {
    const container = render();

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/achievement_burst.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "A burst of colorful useless achievement awards",
    );
  });

  it("omits pack promotions when there is no active pack", () => {
    const container = render({
      initialPacks: [pack({ status: "scheduled", isUpcoming: true })],
    });

    expect(mocks.promo).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain(
      "Limited achievement packs have arrived.",
    );
  });

  it("promotes the first active pack", () => {
    const first = pack();
    const second = pack({ id: "active-2" });

    render({ initialPacks: [first, second] });

    expect(mocks.promo).toHaveBeenCalledExactlyOnceWith({
      pack: first,
      variant: "homepage",
      isLoggedIn: false,
    });
  });

  it("promotes an upcoming pack alongside the active pack", () => {
    const active = pack();
    const upcoming = pack({
      id: "upcoming-1",
      status: "scheduled",
      isUpcoming: true,
    });

    render({
      initialProfile: profile,
      initialEntitlements: entitlements,
      initialPacks: [upcoming, active],
    });

    expect(mocks.promo.mock.calls.map(([props]) => props)).toEqual([
      {
        pack: active,
        variant: "homepage",
        isLoggedIn: true,
      },
      {
        pack: upcoming,
        comingsoon: true,
        variant: "homepage",
        isLoggedIn: true,
      },
    ]);
  });
});
