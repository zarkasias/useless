// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";

vi.mock("@/app/packs/actions", () => ({
  createPackCheckoutAction: vi.fn(),
}));

import { AchievementPackCard } from "@/components/packs/achievement-pack-card";

const pack: StoreAchievementPack = {
  id: "pack-1",
  name: "Unnecessary Achievements",
  slug: "unnecessary",
  description: "A collection of silly accomplishments.",
  price_cents: 499,
  currency: "usd",
  starts_at: null,
  ends_at: null,
  cover_image_path: null,
  theme_key: null,
  status: "active",
  isUpcoming: false,
  owned: false,
  availableForPurchase: true,
  hasEnded: false,
  totalAchievements: 8,
  collectedAchievements: 3,
  completed: false,
};

function render(overrides: Partial<StoreAchievementPack> = {}) {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    createElement(AchievementPackCard, {
      pack: { ...pack, ...overrides },
    }),
  );

  return container;
}

describe("AchievementPackCard", () => {
  it("renders a purchase form containing the pack ID and price", () => {
    const container = render();

    expect(container.querySelector("h2")?.textContent).toBe(pack.name);
    expect(container.textContent).toContain("8 achievements");
    expect(container.textContent).toContain("$4.99 one-time");
    expect(container.textContent).toContain("Unlock for $4.99");

    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(
      form?.querySelector<HTMLInputElement>('input[name="packId"]')?.value,
    ).toBe("pack-1");
    expect(form?.querySelector("button")?.disabled).toBe(false);

    expect(container.textContent).toContain(
      "One-time purchase. Earn the achievements through your daily rotation.",
    );
  });

  it("disables purchasing for unavailable packs", () => {
    const container = render({ availableForPurchase: false });
    const button = container.querySelector("button");

    expect(button?.textContent).toBe("Currently Unavailable");
    expect(button?.disabled).toBe(true);
    expect(container.querySelector("form")).toBeNull();
    expect(container.textContent).not.toContain(
      "One-time purchase. Earn the achievements through your daily rotation.",
    );
  });

  it("shows owned-pack progress and links to the pack", () => {
    const container = render({ owned: true });

    expect(container.textContent).toContain("Owned");
    expect(container.textContent).toContain("Pack progress");
    expect(container.textContent).toContain("3 of 8");
    expect(container.textContent).not.toContain("one-time");
    expect(container.querySelector("form")).toBeNull();

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/packs/unnecessary");
    expect(link?.textContent).toBe("View Pack Progress");

    const progress = container.querySelector<HTMLElement>(
      'div[style*="width"]',
    );
    expect(progress?.style.width).toBe("38%");
  });

  it("shows completion messaging and the completed-pack link", () => {
    const container = render({
      owned: true,
      completed: true,
      collectedAchievements: 8,
    });

    expect(container.textContent).toContain("Pack complete!");
    expect(container.querySelector("a")?.textContent).toBe(
      "View Completed Pack",
    );
    expect(
      container.querySelector('img[alt="Achievement Pack Completed"]'),
    ).not.toBeNull();

    const progress = container.querySelector<HTMLElement>(
      'div[style*="width"]',
    );
    expect(progress?.style.width).toBe("100%");
  });

  it("keeps ended owned packs accessible", () => {
    const container = render({
      owned: true,
      hasEnded: true,
      availableForPurchase: false,
    });

    expect(container.textContent).toContain("No longer available");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/packs/unnecessary",
    );
    expect(container.querySelector("form")).toBeNull();
  });

  it("uses zero progress for an empty owned pack", () => {
    const container = render({
      owned: true,
      totalAchievements: 0,
      collectedAchievements: 0,
    });

    const progress = container.querySelector<HTMLElement>(
      'div[style*="width"]',
    );

    expect(progress?.style.width).toBe("0%");
    expect(container.innerHTML).not.toContain("NaN");
  });

  it("shows fallback artwork and description when neither is supplied", () => {
    const container = render({
      description: null,
      cover_image_path: null,
    });

    expect(container.textContent).toContain("Pack artwork");
    expect(container.textContent).toContain(
      "A seasonal collection of gloriously unnecessary achievements.",
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders supplied artwork and description", () => {
    const container = render({
      cover_image_path: "/packs/unnecessary.png",
    });

    expect(container.textContent).toContain(pack.description);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Unnecessary Achievements pack artwork",
    );
  });

  it("defaults missing currency to USD", () => {
    const container = render({ currency: null });

    expect(container.textContent).toContain("$4.99 one-time");
  });

  it("omits the price badge when no price exists", () => {
    const container = render({
      price_cents: null,
      availableForPurchase: false,
    });

    expect(container.textContent).not.toContain("one-time");
    expect(container.querySelector("form")).toBeNull();
  });
});
