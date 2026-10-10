// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "test-heading-font" },
  nunito: { className: "test-body-font" },
}));

import { FeatureCard } from "@/components/feature-card";

type Props = Parameters<typeof FeatureCard>[0];

function render(overrides: Partial<Props> = {}): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(FeatureCard, {
      variant: "daily",
      title: "A tiny accomplishment",
      description: "Collect something wonderfully unnecessary.",
      ...overrides,
    }),
  );
  return container;
}

describe("FeatureCard", () => {
  it("renders the supplied title and description", () => {
    const container = render();

    expect(container.querySelector("h3")?.textContent).toBe(
      "A tiny accomplishment",
    );
    expect(
      container.querySelector("h3")?.classList.contains("test-heading-font"),
    ).toBe(true);

    const description = container.querySelector("p.test-body-font");
    expect(description?.textContent).toBe(
      "Collect something wonderfully unnecessary.",
    );
  });

  it("rotates left by default", () => {
    const card = render().firstElementChild;

    expect(card?.classList.contains("sm:-rotate-1")).toBe(true);
    expect(card?.classList.contains("sm:rotate-1")).toBe(false);
  });

  it("supports right rotation", () => {
    const card = render({ rotate: "right" }).firstElementChild;

    expect(card?.classList.contains("sm:rotate-1")).toBe(true);
    expect(card?.classList.contains("sm:-rotate-1")).toBe(false);
  });

  it("renders the daily calendar visual", () => {
    const container = render({ variant: "daily" });

    expect(container.textContent).toContain("Today");
    expect(container.textContent).toContain("One tiny win");
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders the example streak and all three days", () => {
    const container = render({ variant: "streak" });

    expect(container.textContent).toContain("3-day streak");
    expect(container.textContent).toContain("Example streak");

    const days = container.querySelector('div[aria-hidden="true"]');
    expect(Array.from(days?.children ?? [], (day) => day.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("renders the collection rarity list", () => {
    const container = render({ variant: "collection" });
    const list = container.querySelector(
      'ul[aria-label="Achievement rarities"]',
    );

    expect(list).not.toBeNull();
    expect(
      Array.from(
        list?.querySelectorAll("li") ?? [],
        (item) => item.textContent,
      ),
    ).toEqual(["Common", "Rare", "Epic", "Legendary"]);
  });

  it("renders the leaderboard podium in second-first-third order", () => {
    const container = render({ variant: "leaderboard" });
    const podium = container.querySelector('div[aria-hidden="true"]');

    expect(
      Array.from(podium?.children ?? [], (place) => place.textContent?.trim()),
    ).toEqual(["2", "1", "3"]);
    expect(podium?.querySelector("svg")).not.toBeNull();
  });

  it("renders the Pro Games visual", () => {
    const container = render({ variant: "games" });

    expect(container.textContent).toContain("Pro Games");
    expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });
});
