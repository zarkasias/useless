// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GameCabinetCard from "@/components/games/game-card";
import { gameCardThemes } from "@/components/games/game-card-themes";

type CardProps = Parameters<typeof GameCabinetCard>[0];

function render(overrides: Partial<CardProps> = {}) {
  const container = document.createElement("div");

  container.innerHTML = renderToStaticMarkup(
    createElement(GameCabinetCard, {
      title: "Useless Solitaire",
      description: "A thoroughly unnecessary card game.",
      icon: "/game_icons/solitaire.webp",
      subscribed: false,
      theme: gameCardThemes.solitaire,
      ...overrides,
    }),
  );

  return container;
}

function labels(container: HTMLElement) {
  return Array.from(container.querySelectorAll("div"), (element) =>
    element.textContent?.trim(),
  );
}

describe("GameCabinetCard", () => {
  it("shows the title, description, and default artwork alternative text", () => {
    const container = render();

    expect(container.querySelector("h3")?.textContent?.trim()).toBe(
      "Useless Solitaire",
    );
    expect(container.querySelector("p")?.textContent).toBe(
      "A thoroughly unnecessary card game.",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Useless Solitaire",
    );
  });

  it("uses custom artwork alternative text when supplied", () => {
    const container = render({
      iconAlt: "A stack of playing cards",
    });

    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "A stack of playing cards",
    );
  });

  it("defaults to coming soon and displays the default footer", () => {
    const container = render();

    expect(labels(container)).toContain("Coming soon");
    expect(labels(container)).toContain("Soon");
    expect(labels(container)).not.toContain("Pro");
    expect(container.textContent).toContain("More Pointless fun incoming");
  });

  it.each([{ subscribed: false }, { subscribed: true }])(
    "shows Soon rather than Pro for unavailable games when subscribed is $subscribed",
    ({ subscribed }) => {
      const container = render({
        available: false,
        subscribed,
      });

      expect(labels(container)).toContain("Coming soon");
      expect(labels(container)).toContain("Soon");
      expect(labels(container)).not.toContain("Pro");
      expect(labels(container)).not.toContain("Ready To Play");
    },
  );

  it("shows the Pro requirement for an available game viewed by a free user", () => {
    const container = render({
      available: true,
      subscribed: false,
    });

    expect(labels(container)).toContain("Ready To Play");
    expect(labels(container)).toContain("Pro");
    expect(labels(container)).not.toContain("Soon");
  });

  it("shows an available game without a lock label for subscribers", () => {
    const container = render({
      available: true,
      subscribed: true,
    });

    expect(labels(container)).toContain("Ready To Play");
    expect(labels(container)).not.toContain("Pro");
    expect(labels(container)).not.toContain("Soon");
  });

  it("uses the supplied footer text", () => {
    const container = render({
      footerText: "Get tangled in pointless fun",
    });

    expect(container.textContent).toContain("Get tangled in pointless fun");
    expect(container.textContent).not.toContain("More Pointless fun incoming");
  });
});
