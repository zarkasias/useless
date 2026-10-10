// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameCard } from "@/lib/types/gamecards";

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  playingCard: vi.fn(),
}));

vi.mock("@/components/games/solitaire/shared/card-drag-preview", () => ({
  createCardDragPreview: mocks.preview,
}));

vi.mock("@/components/games/solitaire/shared/playing-card", () => ({
  PlayingCard: (props: unknown) => {
    mocks.playingCard(props);
    return null;
  },
}));

import { CardColumn } from "@/components/games/solitaire/shared/card-column";

type Props = Parameters<typeof CardColumn>[0];

const cards: GameCard[] = [
  { id: "king", suit: "spades", rank: "K", faceUp: false },
  { id: "queen", suit: "hearts", rank: "Q", faceUp: true },
  { id: "jack", suit: "clubs", rank: "J", faceUp: true },
];

let container: HTMLDivElement | undefined;
let root: Root | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  try {
    await act(async () => {
      root?.unmount();
    });
  } finally {
    container?.remove();
    container = undefined;
    root = undefined;
    vi.unstubAllGlobals();
  }
});

async function render(overrides: Partial<Props> = {}) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(createElement(CardColumn, { cards, ...overrides }));
  });
}

function column(): HTMLElement {
  const element = container?.firstElementChild;
  if (!(element instanceof HTMLElement)) {
    throw new Error("Missing card column");
  }
  return element;
}

function buttons(): HTMLButtonElement[] {
  return Array.from(column().querySelectorAll("button"));
}

async function dispatch(
  target: HTMLElement,
  type: string,
  dataTransfer?: { effectAllowed: string },
): Promise<Event> {
  const event = new Event(type, { bubbles: true, cancelable: true });

  if (dataTransfer) {
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  }

  await act(async () => {
    target.dispatchEvent(event);
  });

  return event;
}

describe("CardColumn", () => {
  it("positions cards and disables face-down cards", async () => {
    await render();

    expect(column().style.minHeight).toBe("340px");
    expect(buttons().map((button) => button.style.top)).toEqual([
      "0px",
      "28px",
      "56px",
    ]);
    expect(buttons().map((button) => button.disabled)).toEqual([
      true,
      false,
      false,
    ]);
    expect(buttons().map((button) => button.draggable)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("supports custom spacing and height", async () => {
    await render({ cardOffset: 40, minHeight: 500 });

    expect(column().style.minHeight).toBe("500px");
    expect(buttons().map((button) => button.style.top)).toEqual([
      "0px",
      "40px",
      "80px",
    ]);
  });

  it("renders and highlights an empty target", async () => {
    await render({ cards: [], validTarget: true, hintTarget: true });

    expect(buttons()).toHaveLength(0);
    expect(column().querySelector(".border-dashed")).not.toBeNull();
    expect(
      column()
        .querySelector(".border-dashed")
        ?.classList.contains("ring-emerald-300"),
    ).toBe(true);

    const target = column().querySelector<HTMLElement>(".pointer-events-none");
    expect(target?.style.top).toBe("0px");
  });

  it("positions a valid-target marker over the last card", async () => {
    await render({ validTarget: true, cardOffset: 40 });

    const target = column().querySelector<HTMLElement>(".pointer-events-none");
    expect(target?.style.top).toBe("80px");
  });

  it("highlights selected cards, hinted stacks, and the target's top card", async () => {
    await render({
      selectedCardIndex: 0,
      hintCardIndex: 1,
      hintTarget: true,
    });

    expect(
      buttons().map((button) => button.classList.contains("ring-amber-300")),
    ).toEqual([true, true, true]);

    expect(
      buttons().map((button) => button.classList.contains("ring-emerald-300")),
    ).toEqual([false, false, true]);
  });

  it("forwards animation flags for the matching cards", async () => {
    await render({
      flippedCardId: "queen",
      autoFinishCardId: "jack",
    });

    expect(mocks.playingCard.mock.calls.map(([props]) => props)).toEqual([
      { card: cards[0], animateFlip: false, animateAutoFinish: false },
      { card: cards[1], animateFlip: true, animateAutoFinish: false },
      { card: cards[2], animateFlip: false, animateAutoFinish: true },
    ]);
  });

  it("forwards card clicks without triggering a column click", async () => {
    const onCardClick = vi.fn();
    const onColumnClick = vi.fn();
    await render({ onCardClick, onColumnClick });

    await act(async () => {
      buttons()[1].click();
    });

    expect(onCardClick).toHaveBeenCalledExactlyOnceWith(1);
    expect(onColumnClick).not.toHaveBeenCalled();

    await act(async () => {
      column().click();
    });

    expect(onColumnClick).toHaveBeenCalledTimes(1);
  });

  it("allows a face-up card click without an optional callback", async () => {
    const onColumnClick = vi.fn();
    await render({ onColumnClick });

    await act(async () => {
      buttons()[1].click();
    });

    expect(onColumnClick).not.toHaveBeenCalled();
  });

  it("creates a drag preview from the dragged card and cards below it", async () => {
    const onCardDragStart = vi.fn();
    await render({ onCardDragStart });

    const dataTransfer = { effectAllowed: "none" };
    const event = await dispatch(buttons()[1], "dragstart", dataTransfer);

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(mocks.preview).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: event }),
      [buttons()[1], buttons()[2]],
    );
    expect(onCardDragStart).toHaveBeenCalledExactlyOnceWith(
      1,
      expect.objectContaining({ nativeEvent: event }),
    );
  });

  it("creates a preview when no drag callback is supplied", async () => {
    await render();

    await dispatch(buttons()[2], "dragstart", {
      effectAllowed: "none",
    });

    expect(mocks.preview).toHaveBeenCalledExactlyOnceWith(expect.anything(), [
      buttons()[2],
    ]);
  });

  it("prevents dragging a face-down card", async () => {
    const onCardDragStart = vi.fn();
    await render({ onCardDragStart });

    const event = await dispatch(buttons()[0], "dragstart");

    expect(event.defaultPrevented).toBe(true);
    expect(mocks.preview).not.toHaveBeenCalled();
    expect(onCardDragStart).not.toHaveBeenCalled();
  });

  it("forwards drag-over, drop, and drag-end events", async () => {
    const onDragOver = vi.fn();
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    await render({ onDragOver, onDrop, onDragEnd });

    const overEvent = await dispatch(column(), "dragover");
    const dropEvent = await dispatch(column(), "drop");
    await dispatch(buttons()[1], "dragend");

    expect(onDragOver).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: overEvent }),
    );
    expect(onDrop).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: dropEvent }),
    );
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
