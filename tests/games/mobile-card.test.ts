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

import MobileCard from "@/components/games/solitaire/shared/mobile-card";

type Props = Parameters<typeof MobileCard>[0];

function render(
  cardOverrides: Partial<GameCard> = {},
  options: Omit<Props, "card"> = {},
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
    createElement(MobileCard, { card, ...options }),
  );
  return container;
}

describe("MobileCard", () => {
  it("hides the rank and suit of a face-down card", () => {
    const container = render({ faceUp: false });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/game_icons/card-back.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.textContent).toBe("");
  });

  it.each([
    { suit: "hearts", symbol: "♥", color: "text-red-700" },
    { suit: "diamonds", symbol: "♦", color: "text-red-700" },
    { suit: "clubs", symbol: "♣", color: "text-slate-900" },
    { suit: "spades", symbol: "♠", color: "text-slate-900" },
  ] as const)(
    "shows the rank, symbol, and color for $suit",
    ({ suit, symbol, color }) => {
      const container = render({ suit });

      expect(container.firstElementChild?.classList.contains(color)).toBe(true);
      expect(container.textContent).toBe(`7${symbol}${symbol}`);
      expect(container.querySelector("img")).toBeNull();
    },
  );

  it.each([
    { rank: "J", image: "/game_icons/jack.webp" },
    { rank: "Q", image: "/game_icons/queen.webp" },
    { rank: "K", image: "/game_icons/king.webp" },
  ] as const)("shows the correct artwork for $rank", ({ rank, image }) => {
    const container = render({ rank, suit: "spades" });

    expect(container.querySelector("img")?.getAttribute("src")).toBe(image);
    expect(container.textContent).toBe(`${rank}♠`);
  });

  it("shows an ace using its rank and suit without face-card artwork", () => {
    const container = render({ rank: "A", suit: "diamonds" });

    expect(container.textContent).toBe("A♦♦");
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not apply Spider spacing or animation by default", () => {
    const container = render();

    expect(container.querySelector(".mt-2")).toBeNull();
    expect(
      container.firstElementChild?.classList.contains(
        "animate-card-auto-finish",
      ),
    ).toBe(false);
  });

  it("adds spacing for Spider cards", () => {
    const container = render({}, { isSpider: true });

    expect(container.querySelector(".mt-2")).not.toBeNull();
  });

  it("animates an active face-up card", () => {
    const container = render({}, { active: true });

    expect(
      container.firstElementChild?.classList.contains(
        "animate-card-auto-finish",
      ),
    ).toBe(true);
  });

  it("does not animate a face-down card even when active", () => {
    const container = render({ faceUp: false }, { active: true });

    expect(
      container.firstElementChild?.classList.contains(
        "animate-card-auto-finish",
      ),
    ).toBe(false);
  });
});
