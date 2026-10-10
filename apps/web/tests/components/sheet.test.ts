// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

async function render(side?: "top" | "right" | "bottom" | "left") {
  await act(async () => {
    root.render(
      createElement(
        Sheet,
        null,
        createElement(SheetTrigger, null, "Open settings"),
        createElement(
          SheetContent,
          { side, className: "custom-content" },
          createElement(
            SheetHeader,
            { className: "custom-header" },
            createElement(
              SheetTitle,
              { className: "custom-title" },
              "Settings",
            ),
            createElement(
              SheetDescription,
              { className: "custom-description" },
              "Change your preferences.",
            ),
          ),
          createElement("p", null, "Settings content"),
          createElement(
            SheetFooter,
            { className: "custom-footer" },
            createElement(SheetClose, null, "Done"),
          ),
        ),
      ),
    );
  });
}

async function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === label,
  );

  if (!button) {
    throw new Error(`Missing button: ${label}`);
  }

  await act(async () => {
    button.click();
  });
}

describe("Sheet", () => {
  it("opens a labeled dialog with its description and content", async () => {
    await render();

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await click("Open settings");

    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("Settings content");
    expect(dialog?.classList.contains("custom-content")).toBe(true);

    const titleId = dialog?.getAttribute("aria-labelledby");
    const descriptionId = dialog?.getAttribute("aria-describedby");

    expect(titleId).toBeTruthy();
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(titleId!)?.textContent).toBe("Settings");
    expect(document.getElementById(descriptionId!)?.textContent).toBe(
      "Change your preferences.",
    );

    expect(
      document.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeNull();

    for (const [slot, className] of [
      ["sheet-header", "custom-header"],
      ["sheet-title", "custom-title"],
      ["sheet-description", "custom-description"],
      ["sheet-footer", "custom-footer"],
    ]) {
      expect(
        document
          .querySelector(`[data-slot="${slot}"]`)
          ?.classList.contains(className),
      ).toBe(true);
    }
  });

  it.each([{ label: "Done" }, { label: "Close" }])(
    "closes through the $label button",
    async ({ label }) => {
      await render();
      await click("Open settings");
      await click(label);

      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.querySelector('[data-slot="sheet-overlay"]')).toBeNull();
    },
  );

  it("closes when Escape is pressed", async () => {
    await render();
    await click("Open settings");

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it.each([
    { side: "top" as const, placement: "top-0" },
    { side: "right" as const, placement: "right-0" },
    { side: "bottom" as const, placement: "bottom-0" },
    { side: "left" as const, placement: "left-0" },
  ])("supports the $side placement", async ({ side, placement }) => {
    await render(side);
    await click("Open settings");

    expect(
      document.querySelector('[role="dialog"]')?.classList.contains(placement),
    ).toBe(true);
  });

  it("defaults to the right placement", async () => {
    await render();
    await click("Open settings");

    expect(
      document.querySelector('[role="dialog"]')?.classList.contains("right-0"),
    ).toBe(true);
  });
});
