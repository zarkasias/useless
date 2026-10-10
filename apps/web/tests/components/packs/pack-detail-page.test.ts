// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getPacks: vi.fn(),
  getEntitlements: vi.fn(),
  getCollected: vi.fn(),
  getPublished: vi.fn(),
  notFound: vi.fn(),
  navbar: vi.fn(),
  achievementCard: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
  getAuthenticatedUserAchievements: mocks.getCollected,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/pack-store-service-server", () => ({
  getStoreAchievementPacks: mocks.getPacks,
  getPublishedAchievementsForPack: mocks.getPublished,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: (props: unknown) => {
    mocks.achievementCard(props);
    return null;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import PackDetailPage from "@/app/packs/[slug]/page";

const profile = { id: "user-1", username: "Alice" };
const pack = {
  id: "pack-1",
  slug: "internet-habits",
  name: "Internet Habits",
  description: "Small browsing accomplishments.",
  theme_key: "default",
  cover_image_path: null,
  owned: true,
  totalAchievements: 3,
  collectedAchievements: 1,
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getPacks.mockResolvedValue([{ ...pack }]);
  mocks.getEntitlements.mockResolvedValue({
    isSubscribed: true,
    subscriptionStatus: "active",
  });
  mocks.getCollected.mockResolvedValue([]);
  mocks.getPublished.mockResolvedValue([]);

  mocks.notFound.mockImplementation(() => {
    throw new Error("TEST_NOT_FOUND");
  });
});

async function render(purchase?: string): Promise<HTMLDivElement> {
  const element = await PackDetailPage({
    params: Promise.resolve({ slug: "internet-habits" }),
    searchParams: Promise.resolve({ purchase }),
  });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("PackDetailPage", () => {
  it("loads the selected pack and renders ownership and rounded progress", async () => {
    const container = await render();

    expect(mocks.getPublished).toHaveBeenCalledExactlyOnceWith("pack-1");
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getCollected).toHaveBeenCalledExactlyOnceWith();
    expect(container.querySelector("h1")?.textContent).toBe("Internet Habits");
    expect(container.textContent).toContain("You own this pack.");
    expect(container.textContent).toContain("1 of 3 collected");
    expect(container.textContent).toContain("33% complete");
    expect(
      container.querySelector<HTMLElement>(".h-full.rounded-full")?.style.width,
    ).toBe("33%");

    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("shows the empty achievement state and artwork placeholder", async () => {
    const container = await render();

    expect(container.textContent).toContain(
      "No achievements have been published for this pack yet.",
    );
    expect(container.textContent).toContain("Pack artwork");
    expect(container.querySelector("img")).toBeNull();
    expect(mocks.achievementCard).not.toHaveBeenCalled();
  });

  it("renders supplied pack artwork", async () => {
    mocks.getPacks.mockResolvedValue([
      { ...pack, cover_image_path: "/icons/pack.webp" },
    ]);

    const container = await render();

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/icons/pack.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Internet Habits artwork",
    );
  });

  it("shows purchase confirmation only for a successful purchase parameter", async () => {
    const container = await render("success");

    expect(container.textContent).toContain("Payment received");
    expect(container.textContent).toContain(
      "Your pack purchase is being confirmed.",
    );
  });

  it("does not show purchase confirmation for a canceled purchase", async () => {
    const container = await render("canceled");

    expect(container.textContent).not.toContain("Payment received");
  });

  it("offers a return link for an unowned pack", async () => {
    mocks.getPacks.mockResolvedValue([{ ...pack, owned: false }]);

    const container = await render();

    const returnLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent === "Return to Packs",
    );
    expect(returnLink?.getAttribute("href")).toBe("/packs");
    expect(container.textContent).not.toContain("You own this pack.");
    expect(container.textContent).not.toContain("% complete");
  });

  it("uses zero progress for a pack with no achievements", async () => {
    mocks.getPacks.mockResolvedValue([
      { ...pack, totalAchievements: 0, collectedAchievements: 0 },
    ]);

    const container = await render();

    expect(
      container.querySelector<HTMLElement>(".h-full.rounded-full")?.style.width,
    ).toBe("0%");
    expect(container.textContent).not.toContain("% complete");
  });

  it("maps collected timestamps to cards and dims uncollected achievements", async () => {
    const published = [
      { id: "a1", title: "Collected" },
      { id: "a2", title: "Uncollected" },
    ];
    const unlockedAt = "2026-10-08T12:00:00.000Z";
    mocks.getPublished.mockResolvedValue(published);
    mocks.getCollected.mockResolvedValue([
      { id: "a1", created_at: unlockedAt },
    ]);

    const container = await render();

    expect(mocks.achievementCard.mock.calls.map(([props]) => props)).toEqual([
      {
        achievement: published[0],
        unlockedAt,
        ingrid: true,
        showShareButton: false,
        variant: "compact",
      },
      {
        achievement: published[1],
        unlockedAt: undefined,
        ingrid: true,
        showShareButton: false,
        variant: "compact",
      },
    ]);
    expect(container.querySelectorAll(".grayscale")).toHaveLength(1);
  });

  it("supports guests without loading personal account data", async () => {
    mocks.getUser.mockResolvedValue(null);
    mocks.getProfile.mockResolvedValue(null);

    await render();

    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getCollected).not.toHaveBeenCalled();
    expect(mocks.navbar).not.toHaveBeenCalled();
    expect(mocks.getPublished).toHaveBeenCalledExactlyOnceWith("pack-1");
  });

  it("falls back to the default theme for an unknown theme key", async () => {
    const defaultContainer = await render();
    const defaultClass =
      defaultContainer.querySelector('[data-slot="card"]')?.className;

    mocks.getPacks.mockResolvedValue([{ ...pack, theme_key: "unknown-theme" }]);

    const fallbackContainer = await render();

    expect(
      fallbackContainer.querySelector('[data-slot="card"]')?.className,
    ).toBe(defaultClass);
  });

  it("returns not found when the requested slug does not exist", async () => {
    mocks.getPacks.mockResolvedValue([{ ...pack, slug: "another-pack" }]);

    await expect(render()).rejects.toThrow("TEST_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(mocks.getPublished).not.toHaveBeenCalled();
  });

  it("propagates published-achievement loading failures", async () => {
    const error = new Error("Achievements unavailable");
    mocks.getPublished.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
