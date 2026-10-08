// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

let container: HTMLDivElement;
let root: Root;
let originalScrollIntoView: PropertyDescriptor | undefined;

const onValueChange = vi.fn();

beforeEach(() => {
  onValueChange.mockReset();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  // jsdom has no scrolling layout implementation.
  originalScrollIntoView = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollIntoView",
  );
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });

  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();

  if (originalScrollIntoView) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScrollIntoView,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }

  vi.unstubAllGlobals();
});

async function render({
  size,
  position,
  disabled = false,
}: {
  size?: "sm" | "default";
  position?: "item-aligned" | "popper";
  disabled?: boolean;
} = {}) {
  await act(async () => {
    root.render(
      createElement(
        Select,
        { onValueChange, disabled },
        createElement(
          SelectTrigger,
          {
            "aria-label": "Difficulty",
            className: "custom-trigger",
            size,
          },
          createElement(SelectValue, {
            placeholder: "Choose difficulty",
          }),
        ),
        createElement(
          SelectContent,
          { position, className: "custom-content" },
          createElement(
            SelectGroup,
            null,
            createElement(SelectLabel, null, "Difficulty levels"),
            createElement(SelectItem, { value: "easy" }, "Easy"),
            createElement(SelectItem, { value: "medium" }, "Medium"),
            createElement(SelectSeparator),
            createElement(
              SelectItem,
              { value: "hard", disabled: true },
              "Hard",
            ),
          ),
        ),
      ),
    );
  });
}

function trigger() {
  const element =
    container.querySelector<HTMLButtonElement>('[role="combobox"]');

  if (!element) {
    throw new Error("Missing select trigger");
  }

  return element;
}

async function open() {
  await act(async () => {
    trigger().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

describe("Select", () => {
  it("renders a labeled trigger and placeholder", async () => {
    await render();

    expect(trigger().getAttribute("aria-label")).toBe("Difficulty");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("data-size")).toBe("default");
    expect(trigger().textContent).toContain("Choose difficulty");
    expect(trigger().classList.contains("custom-trigger")).toBe(true);
  });

  it.each([
    { position: "item-aligned" as const },
    { position: "popper" as const },
  ])(
    "renders labeled options with the $position layout",
    async ({ position }) => {
      await render({ position });
      await open();

      expect(trigger().getAttribute("aria-expanded")).toBe("true");

      const content = document.querySelector('[data-slot="select-content"]');
      expect(content?.getAttribute("role")).toBe("listbox");
      expect(content?.classList.contains("custom-content")).toBe(true);
      expect(
        document.querySelector('[data-slot="select-label"]')?.textContent,
      ).toBe("Difficulty levels");
      expect(
        Array.from(
          document.querySelectorAll('[role="option"]'),
          (element) => element.textContent,
        ),
      ).toEqual(["Easy", "Medium", "Hard"]);
      expect(
        document.querySelector('[data-slot="select-separator"]'),
      ).not.toBeNull();
    },
  );

  it("selects an option with the keyboard and closes the list", async () => {
    await render();
    await open();

    const option = Array.from(
      document.querySelectorAll<HTMLElement>('[role="option"]'),
    ).find((element) => element.textContent === "Medium");

    if (!option) {
      throw new Error("Missing Medium option");
    }

    await act(async () => {
      option.focus();
      option.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("medium");
    expect(trigger().textContent).toContain("Medium");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("marks unavailable options disabled", async () => {
    await render();
    await open();

    const option = Array.from(
      document.querySelectorAll('[role="option"]'),
    ).find((element) => element.textContent === "Hard");

    expect(option?.getAttribute("aria-disabled")).toBe("true");
    expect(option?.hasAttribute("data-disabled")).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("supports the small trigger size", async () => {
    await render({ size: "sm" });

    expect(trigger().getAttribute("data-size")).toBe("sm");
  });

  it("disables the trigger when the select is disabled", async () => {
    await render({ disabled: true });

    expect(trigger().disabled).toBe(true);

    await act(async () => {
      trigger().click();
    });

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
