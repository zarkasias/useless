// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/home/canvas-atmosphere", () => ({
  CanvasAtmosphere: ({ pulse }: { pulse: number }) =>
    createElement("div", {
      "data-testid": "atmosphere",
      "data-pulse": pulse,
    }),
}));

vi.mock("@/components/home/hero-achievement-card", () => ({
  HeroAchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement("article", null, achievement.title),
}));

import { HeroAchievementScene } from "@/components/home/hero-achievement-scene";

type Props = Parameters<typeof HeroAchievementScene>[0];

function achievement(id: string): Achievement {
  return {
    id,
    title: `Achievement ${id}`,
    description: "A published showcase achievement",
    type: "COMMON",
    emoji: "🏆",
    icon_path: `/icons/${id}.png`,
    created_at: "2026-10-09",
    status: "published",
    is_secret: false,
    trigger_type: null,
    trigger_config: null,
  };
}

const achievements = [achievement("one"), achievement("two")];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render(overrides: Partial<Props> = {}) {
  await act(async () => {
    root.render(
      createElement(HeroAchievementScene, {
        achievements,
        selectedIndex: 0,
        onSelect: vi.fn(),
        ...overrides,
      }),
    );
  });
}

function previewButton(): HTMLButtonElement {
  const found = container.querySelector<HTMLButtonElement>(
    'button[aria-label^="Preview:"]',
  );

  if (!found) throw new Error("Missing achievement preview");
  return found;
}

describe("homepage hero achievement scene", () => {
  it("renders nothing when no eligible achievements exist", async () => {
    await render({ achievements: [] });

    expect(container.innerHTML).toBe("");
  });

  it("shows the selected achievement and marks its selection control", async () => {
    await render({ selectedIndex: 1 });

    expect(container.querySelector("article")?.textContent).toBe(
      "Achievement two",
    );
    expect(
      container
        .querySelector('button[aria-label="Preview Achievement two"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      container
        .querySelector('button[aria-label="Preview Achievement one"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("falls back to the first achievement for an invalid selected index", async () => {
    await render({ selectedIndex: 99 });

    expect(container.querySelector("article")?.textContent).toBe(
      "Achievement one",
    );
  });

  it("advances to the next achievement and triggers a particle pulse", async () => {
    const onSelect = vi.fn();
    await render({ onSelect });

    await act(async () => previewButton().click());

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
    expect(
      container
        .querySelector('[data-testid="atmosphere"]')
        ?.getAttribute("data-pulse"),
    ).toBe("1");
  });

  it("wraps from the last achievement to the first", async () => {
    const onSelect = vi.fn();
    await render({ selectedIndex: 1, onSelect });

    await act(async () => previewButton().click());

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("allows direct selection using the achievement controls", async () => {
    const onSelect = vi.fn();
    await render({ onSelect });

    const control = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Preview Achievement two"]',
    );
    if (!control) throw new Error("Missing selection control");

    await act(async () => control.click());

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
    expect(
      container
        .querySelector('[data-testid="atmosphere"]')
        ?.getAttribute("data-pulse"),
    ).toBe("1");
  });
});

function movePointer(
  target: HTMLButtonElement,
  pointerType: string,
  clientX: number,
  clientY: number,
) {
  const event = new Event("pointermove", { bubbles: true });

  Object.defineProperties(event, {
    pointerType: { value: pointerType },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });

  target.dispatchEvent(event);
}

function mockPreviewBounds(target: HTMLButtonElement) {
  vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    toJSON: () => ({}),
  });
}

describe("homepage hero pointer behavior", () => {
  it("tilts the achievement in response to mouse position", async () => {
    await render();
    const target = previewButton();
    mockPreviewBounds(target);

    await act(async () => movePointer(target, "mouse", 200, 100));

    expect(target.style.getPropertyValue("--tilt-x")).toBe("-6deg");
    expect(target.style.getPropertyValue("--tilt-y")).toBe("6deg");
  });

  it.each(["touch", "pen"])(
    "does not tilt for %s input",
    async (pointerType) => {
      await render();
      const target = previewButton();
      mockPreviewBounds(target);

      await act(async () => movePointer(target, pointerType, 200, 100));

      expect(target.style.getPropertyValue("--tilt-x")).toBe("");
      expect(target.style.getPropertyValue("--tilt-y")).toBe("");
    },
  );

  it("does not tilt when reduced motion is enabled", async () => {
    const mediaMock = vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string): MediaQueryList => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }),
    );

    try {
      await render();
      const target = previewButton();
      mockPreviewBounds(target);

      await act(async () => movePointer(target, "mouse", 200, 100));

      expect(mediaMock).toHaveBeenCalledWith(
        "(prefers-reduced-motion: reduce)",
      );
      expect(target.style.getPropertyValue("--tilt-x")).toBe("");
      expect(target.style.getPropertyValue("--tilt-y")).toBe("");
    } finally {
      mediaMock.mockRestore();
    }
  });

  it("resets tilt when the pointer leaves", async () => {
    await render();
    const target = previewButton();
    mockPreviewBounds(target);

    await act(async () => movePointer(target, "mouse", 200, 100));

    await act(async () => {
      target.dispatchEvent(
        new MouseEvent("pointerout", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
    });

    expect(target.style.getPropertyValue("--tilt-x")).toBe("0deg");
    expect(target.style.getPropertyValue("--tilt-y")).toBe("0deg");
  });
});
