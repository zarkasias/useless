// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";

const mocks = vi.hoisted(() => ({
  playingCard: vi.fn(),
}));

vi.mock("@/components/games/solitaire/shared/playing-card", () => ({
  PlayingCard: (props: unknown) => {
    mocks.playingCard(props);
    return null;
  },
}));

import { CardPile } from "@/components/games/solitaire/shared/card-pile";

type Props = Parameters<typeof CardPile>[0];

const card: GameCard = {
  id: "hearts-7",
  suit: "hearts",
  rank: "7",
  faceUp: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

function render(overrides: Partial<Props> = {}): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(CardPile, {
      label: "Waste",
      card,
      ...overrides,
    }),
  );
  return container;
}

function button(container: HTMLElement): HTMLButtonElement {
  const result = container.querySelector("button");
  if (!result) throw new Error("Missing pile button");
  return result;
}

describe("CardPile display", () => {
  it("renders the label and forwards the card with default animation flags", () => {
    const container = render();

    expect(container.textContent).toContain("Waste");
    expect(mocks.playingCard).toHaveBeenLastCalledWith({
      card,
      animateFlip: false,
      animateAutoFinish: false,
    });
    expect(button(container).type).toBe("button");
    expect(button(container).disabled).toBe(true);
    expect(button(container).draggable).toBe(false);
  });

  it("renders an empty placeholder when there is no card", () => {
    const container = render({ card: null });

    expect(mocks.playingCard).not.toHaveBeenCalled();
    expect(container.querySelector(".border-dashed")).not.toBeNull();
    expect(button(container).draggable).toBe(false);
  });

  it("forces the displayed card face down without changing the original", () => {
    render({ faceDown: true });

    expect(mocks.playingCard).toHaveBeenLastCalledWith({
      card: { ...card, faceUp: false },
      animateFlip: false,
      animateAutoFinish: false,
    });
    expect(card.faceUp).toBe(true);
  });

  it("enables clicking and dragging when handlers are provided", () => {
    const container = render({
      onClick: vi.fn(),
      onDragStart: vi.fn(),
    });

    expect(button(container).disabled).toBe(false);
    expect(button(container).draggable).toBe(true);
  });

  it("does not make an empty pile draggable", () => {
    const container = render({
      card: null,
      onClick: vi.fn(),
      onDragStart: vi.fn(),
    });

    expect(button(container).disabled).toBe(false);
    expect(button(container).draggable).toBe(false);
  });

  it("gives selected highlighting precedence over valid-target highlighting", () => {
    const container = render({ selected: true, validTarget: true });

    expect(button(container).classList.contains("ring-amber-300")).toBe(true);
    expect(button(container).classList.contains("ring-emerald-300/80")).toBe(
      false,
    );
  });

  it("highlights a valid target", () => {
    const container = render({ validTarget: true });

    expect(button(container).classList.contains("ring-emerald-300/80")).toBe(
      true,
    );
  });

  it("highlights a hinted pile", () => {
    const container = render({ isHint: true });

    expect(button(container).classList.contains("ring-amber-300")).toBe(true);
    expect(button(container).classList.contains("ring-2")).toBe(true);
  });

  it("forwards flip and matching auto-finish animation flags", () => {
    render({ animateFlip: true, autoFinishCardId: card.id });

    expect(mocks.playingCard).toHaveBeenLastCalledWith({
      card,
      animateFlip: true,
      animateAutoFinish: true,
    });
  });

  it("does not animate auto-finish for a different card", () => {
    render({ autoFinishCardId: "another-card" });

    expect(mocks.playingCard).toHaveBeenLastCalledWith({
      card,
      animateFlip: false,
      animateAutoFinish: false,
    });
  });
});
