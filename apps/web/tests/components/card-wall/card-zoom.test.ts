// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "fredoka" },
  nunito: { className: "nunito" },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import { CardZoom } from "@/components/card-wall/card-zoom";

const achievement: Achievement = {
  id: "mouse-mileage",
  title: "Mouse Mileage",
  description: "Moved cursor 1km worth of screen distance. Marathon runner!",
  type: "RARE",
  emoji: "🖱️",
  icon_path: "/achievement_icons/webp/mouse-mileage.webp",
  created_at: "2026-01-01",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
  status: "published",
};

let container: HTMLDivElement;
let root: Root;
let source: HTMLButtonElement;
let reducedMotion = false;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: reducedMotion && media.includes("reduce"),
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );

  source = document.createElement("button");
  source.textContent = "wall card";
  document.body.appendChild(source);
  source.focus();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  source.remove();
  reducedMotion = false;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function open(
  props: Partial<Parameters<typeof CardZoom>[0]> = {},
  onClosed = vi.fn(),
) {
  await act(async () => {
    root.render(
      createElement(CardZoom, {
        target: { achievement, source, hideSource: true },
        locked: false,
        onClosed,
        ...props,
      }),
    );
  });

  return onClosed;
}

const dialog = () => container.querySelector<HTMLElement>("[role=dialog]");

async function press(key: string) {
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

async function finishClose() {
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
}

describe("CardZoom", () => {
  it("opens as a labelled dialog with the whole card, and hides the source", async () => {
    await open();

    expect(dialog()?.getAttribute("aria-modal")).toBe("true");
    expect(
      document.getElementById(dialog()!.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toBe("Mouse Mileage");
    expect(dialog()?.textContent).toContain(achievement.description);
    expect(source.style.visibility).toBe("hidden");
  });

  it("leaves a button source visible", async () => {
    await open({ target: { achievement, source, hideSource: false } });

    expect(source.style.visibility).toBe("");
  });

  it("moves focus into the card, and back to where it was on close", async () => {
    const onClosed = await open();

    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close");

    await press("Escape");
    await finishClose();

    expect(onClosed).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(source);
    expect(source.style.visibility).toBe("");
  });

  it.each([
    ["the X", "Close"],
    ["the scrim", "Close and go back to the wall"],
  ])("closes from %s", async (_, label) => {
    const onClosed = await open();

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!
        .click();
    });
    await finishClose();

    expect(onClosed).toHaveBeenCalledOnce();
  });

  it("closes only once, however many times it's asked", async () => {
    const onClosed = await open();

    await press("Escape");
    await press("Escape");
    await finishClose();

    expect(onClosed).toHaveBeenCalledOnce();
  });

  it("keeps Tab inside the zoomed card", async () => {
    const outside = document.createElement("button");

    document.body.appendChild(outside);
    await open({ actions: createElement("button", null, "Share") });

    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    // From the last item (Share), Tab wraps to the first (the X).
    container
      .querySelectorAll<HTMLButtonElement>("button")
      .forEach((button) => {
        if (button.textContent === "Share") button.focus();
      });
    await act(async () => {
      document.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Close");
    outside.remove();
  });

  it("shows the locked look and note instead of actions when locked", async () => {
    await open({
      locked: true,
      actions: createElement("button", null, "Share"),
    });

    expect(container.textContent).toContain("Locked. Unlock it to share it.");
    expect(container.textContent).not.toContain("Share");
  });

  it("shows the actions, heading and footnote when unlocked", async () => {
    await open({
      actions: createElement("button", null, "Share"),
      heading: "You unlocked this. Now tell everyone.",
      footnote: "1 of 10 free.",
    });

    expect(container.textContent).toContain("Share");
    expect(container.textContent).toContain(
      "You unlocked this. Now tell everyone.",
    );
    expect(container.textContent).toContain("1 of 10 free.");
    expect(container.textContent).not.toContain("Locked.");
  });

  it("opens and closes without animation under reduced motion", async () => {
    reducedMotion = true;
    const onClosed = await open();

    expect(dialog()?.style.transform).toBe("");

    await press("Escape");

    // No waiting for an animation.
    expect(onClosed).toHaveBeenCalledOnce();
  });
});
