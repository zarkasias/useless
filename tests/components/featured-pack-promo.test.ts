// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";

import { FeaturedPackPromo } from "@/components/packs/featured-pack-promo";

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

type PromoProps = Parameters<typeof FeaturedPackPromo>[0];

function render(
  overrides: Partial<StoreAchievementPack> = {},
  props: Omit<Partial<PromoProps>, "pack"> = {},
) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(FeaturedPackPromo, {
      pack: { ...pack, ...overrides },
      ...props,
    }),
  );
  return container;
}

describe("FeaturedPackPromo dashboard", () => {
  it("shows the pack price and links unowned packs to the store", () => {
    const container = render();

    expect(container.textContent).toContain("Unnecessary Achievements");
    expect(container.textContent).toContain("8 achievements");
    expect(container.textContent).toContain("$4.99 one-time");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/packs");
    expect(container.querySelector("a")?.textContent).toContain("Explore");
  });

  it("shows ownership and collection progress instead of a purchase price", () => {
    const container = render({ owned: true });

    expect(container.textContent).toContain("Owned");
    expect(container.textContent).toContain("3 of 8 collected");
    expect(container.textContent).not.toContain("one-time");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/packs/unnecessary",
    );
    expect(container.querySelector("a")?.textContent).toContain("View");
  });

  it("omits the price when none is configured", () => {
    const container = render({ price_cents: null });

    expect(container.textContent).not.toContain("one-time");
    expect(container.querySelector("a")).not.toBeNull();
  });

  it("defaults missing currency to USD", () => {
    const container = render({ currency: null });

    expect(container.textContent).toContain("$4.99 one-time");
  });

  it("renders configured artwork with descriptive alternative text", () => {
    const container = render({
      cover_image_path: "/packs/unnecessary.png",
    });

    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Unnecessary Achievements artwork",
    );
  });
});

describe("FeaturedPackPromo homepage", () => {
  it.each([
    { isLoggedIn: false, href: "/login?next=/packs" },
    { isLoggedIn: true, href: "/packs" },
  ])(
    "uses the appropriate store destination when logged in is $isLoggedIn",
    ({ isLoggedIn, href }) => {
      const container = render({}, { variant: "homepage", isLoggedIn });

      const links = container.querySelectorAll("a");

      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        expect(link.getAttribute("href")).toBe(href);
      }
      expect(container.textContent).toContain("Explore Pack");
    },
  );

  it("links owned packs to their detail page and shows rounded progress", () => {
    const container = render({ owned: true }, { variant: "homepage" });

    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/packs/unnecessary");
    }

    const progressBars = container.querySelectorAll<HTMLElement>(
      'div[style*="width"]',
    );

    expect(progressBars.length).toBeGreaterThan(0);
    for (const progress of progressBars) {
      expect(progress.style.width).toBe("38%");
    }

    expect(container.textContent).toContain("3 of 8 collected");
    expect(container.textContent).not.toContain("one-time");
  });

  it("uses zero progress when the pack contains no achievements", () => {
    const container = render(
      {
        owned: true,
        totalAchievements: 0,
        collectedAchievements: 0,
      },
      { variant: "homepage" },
    );

    const progressBars = container.querySelectorAll<HTMLElement>(
      'div[style*="width"]',
    );

    expect(progressBars.length).toBeGreaterThan(0);
    for (const progress of progressBars) {
      expect(progress.style.width).toBe("0%");
    }

    expect(container.innerHTML).not.toContain("NaN");
  });

  it("shows coming-soon messaging without purchase links", () => {
    const container = render(
      { isUpcoming: true },
      { variant: "homepage", comingsoon: true },
    );

    expect(container.textContent).toContain("Coming Soon");
    expect(container.querySelector("a")).toBeNull();
  });

  it("renders artwork and description when supplied", () => {
    const container = render(
      { cover_image_path: "/packs/unnecessary.png" },
      { variant: "homepage" },
    );

    expect(container.textContent).toContain(pack.description);

    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);

    for (const image of images) {
      expect(image.getAttribute("alt")).toBe(
        "Unnecessary Achievements artwork",
      );
    }
  });
});
