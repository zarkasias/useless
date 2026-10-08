// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

async function render(align?: "start" | "center" | "end") {
  await act(async () => {
    root.render(
      createElement(
        Popover,
        null,
        createElement(
          PopoverAnchor,
          null,
          createElement(PopoverTrigger, null, "Show details"),
        ),
        createElement(
          PopoverContent,
          {
            align,
            className: "custom-content",
            "aria-label": "Achievement details",
          },
          createElement(
            PopoverHeader,
            { className: "custom-header" },
            createElement(
              PopoverTitle,
              { className: "custom-title" },
              "Achievement",
            ),
            createElement(
              PopoverDescription,
              { className: "custom-description" },
              "An unnecessary accomplishment.",
            ),
          ),
        ),
      ),
    );
  });
}

function trigger() {
  const button = container.querySelector<HTMLButtonElement>(
    '[data-slot="popover-trigger"]',
  );

  if (!button) {
    throw new Error("Missing popover trigger");
  }

  return button;
}

async function toggle() {
  await act(async () => {
    trigger().click();
  });
}

describe("Popover", () => {
  it("opens its content through the trigger", async () => {
    await render();

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();

    await toggle();

    const content = document.querySelector('[data-slot="popover-content"]');

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(content?.getAttribute("role")).toBe("dialog");
    expect(content?.getAttribute("aria-label")).toBe("Achievement details");
    expect(content?.textContent).toContain("Achievement");
    expect(content?.textContent).toContain("An unnecessary accomplishment.");

    for (const [slot, className] of [
      ["popover-content", "custom-content"],
      ["popover-header", "custom-header"],
      ["popover-title", "custom-title"],
      ["popover-description", "custom-description"],
    ]) {
      expect(
        document
          .querySelector(`[data-slot="${slot}"]`)
          ?.classList.contains(className),
      ).toBe(true);
    }
  });

  it("closes when the trigger is clicked again", async () => {
    await render();
    await toggle();
    await toggle();

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  });

  it("closes when Escape is pressed", async () => {
    await render();
    await toggle();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  });

  it.each([
    { align: "start" as const },
    { align: "center" as const },
    { align: "end" as const },
  ])("supports $align alignment", async ({ align }) => {
    await render(align);
    await toggle();

    expect(
      document
        .querySelector('[data-slot="popover-content"]')
        ?.getAttribute("data-align"),
    ).toBe(align);
  });
});
