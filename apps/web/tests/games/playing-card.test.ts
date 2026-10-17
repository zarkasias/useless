// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => createElement("img", { src, alt, className }),
}));

import { PlayingCard } from "@/components/games/solitaire/shared/playing-card";

type Props = Parameters<typeof PlayingCard>[0];

function render(
  cardOverrides: Partial<GameCard> = {},
  animationProps: Omit<Props, "card"> = {},
): HTMLDivElement {
  const card: GameCard = {
    id: "hearts-7",
    suit: "hearts",
    rank: "7",
    faceUp: true,
    ...cardOverrides,
  };

  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(PlayingCard, { card, ...animationProps }),
  );
  return container;
}

describe("PlayingCard", () => {
  it("shows only the card back for a face-down card", () => {
    const container = render({ faceUp: false });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/game_icons/card-back.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.textContent?.trim()).toBe("");
  });

  it.each([
    { suit: "hearts", symbol: "♥", color: "text-red-600" },
    { suit: "diamonds", symbol: "♦", color: "text-red-600" },
    { suit: "clubs", symbol: "♣", color: "text-gray-900" },
    { suit: "spades", symbol: "♠", color: "text-gray-900" },
  ] as const)(
    "shows the rank and correctly colored symbol for $suit",
    ({ suit, symbol, color }) => {
      const container = render({ suit, rank: "7" });

      expect(
        Array.from(
          container.querySelectorAll("span"),
          (span) => span.textContent,
        ),
      ).toEqual(["7", "7"]);

      expect(container.textContent).toContain(symbol);
      expect(container.querySelectorAll(`.${color}`)).toHaveLength(3);
      expect(container.querySelector("img")).toBeNull();
    },
  );

  it("renders an ace with a large central suit symbol", () => {
    const container = render({ rank: "A", suit: "spades" });

    expect(
      Array.from(
        container.querySelectorAll("span"),
        (span) => span.textContent,
      ),
    ).toEqual(["A", "A"]);

    const centerSymbol = container.querySelector(".text-3xl");
    expect(centerSymbol?.textContent).toBe("♠");
    expect(centerSymbol?.classList.contains("text-gray-900")).toBe(true);
    expect(container.querySelector("img")).toBeNull();
  });

  it.each([
    { rank: "J", image: "/game_icons/jack.webp" },
    { rank: "Q", image: "/game_icons/queen.webp" },
    { rank: "K", image: "/game_icons/king.webp" },
  ] as const)("uses the correct artwork for $rank", ({ rank, image }) => {
    const container = render({ rank, suit: "diamonds" });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(image);
    expect(
      Array.from(
        container.querySelectorAll("span"),
        (span) => span.textContent,
      ),
    ).toEqual(["♦", "♦"]);
  });

  it("does not animate by default", () => {
    const card = render().firstElementChild;

    expect(card?.classList.contains("animate-card-flip-in")).toBe(false);
    expect(card?.classList.contains("animate-card-auto-finish")).toBe(false);
  });

  it.each([
    { animateFlip: true, animateAutoFinish: false },
    { animateFlip: false, animateAutoFinish: true },
    { animateFlip: true, animateAutoFinish: true },
  ])(
    "applies animation flags: flip=$animateFlip, autoFinish=$animateAutoFinish",
    ({ animateFlip, animateAutoFinish }) => {
      const card = render(
        {},
        { animateFlip, animateAutoFinish },
      ).firstElementChild;

      expect(card?.classList.contains("animate-card-flip-in")).toBe(
        animateFlip,
      );
      expect(card?.classList.contains("animate-card-auto-finish")).toBe(
        animateAutoFinish,
      );
    },
  );
});
