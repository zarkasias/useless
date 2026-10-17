// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCardDragPreview: vi.fn(),
}));

vi.mock("@/components/games/solitaire/shared/card-drag-preview", () => ({
  createCardDragPreview: mocks.createCardDragPreview,
}));

vi.mock("@/components/games/solitaire/shared/playing-card", () => ({
  PlayingCard: () => null,
}));

import { CardPile } from "@/components/games/solitaire/shared/card-pile";

type Props = Parameters<typeof CardPile>[0];

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
    root = undefined;
    container = undefined;
    vi.unstubAllGlobals();
  }
});

async function render(overrides: Partial<Props> = {}) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Test root was not initialized");

  await act(async () => {
    activeRoot.render(
      createElement(CardPile, {
        label: "Waste",
        card: {
          id: "hearts-7",
          suit: "hearts",
          rank: "7",
          faceUp: true,
        },
        onClick: vi.fn(),
        ...overrides,
      }),
    );
  });
}

function getButton(): HTMLButtonElement {
  const button = container?.querySelector("button");
  if (!button) throw new Error("Missing pile button");
  return button;
}

async function dispatchDrag(type: string): Promise<Event> {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });

  await act(async () => {
    getButton().dispatchEvent(event);
  });

  return event;
}

describe("CardPile interactions", () => {
  it("calls the click handler", async () => {
    const onClick = vi.fn();
    await render({ onClick });

    await act(async () => {
      getButton().click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables clicking when no click handler is provided", async () => {
    await render({ onClick: undefined });

    expect(getButton().disabled).toBe(true);
  });

  it("calls the drag handler before creating the preview", async () => {
    const onDragStart = vi.fn(() => {
      expect(mocks.createCardDragPreview).not.toHaveBeenCalled();
    });
    await render({ onDragStart });

    const event = await dispatchDrag("dragstart");

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0]).toHaveLength(1);
    expect(mocks.createCardDragPreview).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: event }),
      [getButton()],
    );
  });

  it("skips the preview when the drag handler cancels dragging", async () => {
    const onDragStart: NonNullable<Props["onDragStart"]> = (event) => {
      event.preventDefault();
    };
    await render({ onDragStart });

    const event = await dispatchDrag("dragstart");

    expect(event.defaultPrevented).toBe(true);
    expect(mocks.createCardDragPreview).not.toHaveBeenCalled();
  });

  it("handles a dispatched drag event without an optional drag handler", async () => {
    await render({ onDragStart: undefined });

    expect(getButton().draggable).toBe(false);

    await dispatchDrag("dragstart");

    expect(mocks.createCardDragPreview).toHaveBeenCalledTimes(1);
  });

  it("forwards drag-over, drop, and drag-end events", async () => {
    const onDragOver = vi.fn();
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();

    await render({ onDragOver, onDrop, onDragEnd });

    const overEvent = await dispatchDrag("dragover");
    const dropEvent = await dispatchDrag("drop");
    await dispatchDrag("dragend");

    expect(onDragOver).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: overEvent }),
    );
    expect(onDrop).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ nativeEvent: dropEvent }),
    );
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
