// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

let container: HTMLDivElement;
let root: Root;

const selected = vi.fn();
const checked = vi.fn();
const radioChanged = vi.fn();

beforeEach(() => {
  selected.mockReset();
  checked.mockReset();
  radioChanged.mockReset();

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

async function render(submenuOpen = false) {
  await act(async () => {
    root.render(
      createElement(
        DropdownMenu,
        { defaultOpen: true },
        createElement(DropdownMenuTrigger, null, "Actions"),
        createElement(
          DropdownMenuContent,
          { className: "custom-menu" },
          createElement(DropdownMenuLabel, { inset: true }, "Preferences"),
          createElement(
            DropdownMenuGroup,
            null,
            createElement(
              DropdownMenuItem,
              { onSelect: selected, inset: true },
              "Open profile",
              createElement(DropdownMenuShortcut, null, "⌘P"),
            ),
            createElement(
              DropdownMenuItem,
              {
                disabled: true,
                onSelect: selected,
                variant: "destructive",
              },
              "Delete",
            ),
          ),
          createElement(DropdownMenuSeparator),
          createElement(
            DropdownMenuCheckboxItem,
            { checked: true, onCheckedChange: checked },
            "Show previews",
          ),
          createElement(
            DropdownMenuRadioGroup,
            { value: "highest", onValueChange: radioChanged },
            createElement(
              DropdownMenuRadioItem,
              { value: "highest" },
              "Highest first",
            ),
            createElement(
              DropdownMenuRadioItem,
              { value: "lowest" },
              "Lowest first",
            ),
          ),
          createElement(
            DropdownMenuSub,
            { defaultOpen: submenuOpen },
            createElement(
              DropdownMenuSubTrigger,
              { inset: true },
              "More options",
            ),
            createElement(
              DropdownMenuPortal,
              null,
              createElement(
                DropdownMenuSubContent,
                null,
                createElement(DropdownMenuItem, null, "Additional setting"),
              ),
            ),
          ),
        ),
      ),
    );
  });
}

function element(selector: string) {
  const result = document.querySelector<HTMLElement>(selector);

  if (!result) {
    throw new Error(`Missing menu element: ${selector}`);
  }

  return result;
}

async function click(selector: string) {
  await act(async () => {
    element(selector).click();
  });
}

describe("DropdownMenu", () => {
  it("renders menu content, labels, groups, and shortcuts", async () => {
    await render();

    expect(
      element('[data-slot="dropdown-menu-trigger"]').getAttribute(
        "aria-expanded",
      ),
    ).toBe("true");

    const content = element('[data-slot="dropdown-menu-content"]');

    expect(content.getAttribute("role")).toBe("menu");
    expect(content.classList.contains("custom-menu")).toBe(true);
    expect(element('[data-slot="dropdown-menu-label"]').textContent).toBe(
      "Preferences",
    );
    expect(element('[data-slot="dropdown-menu-shortcut"]').textContent).toBe(
      "⌘P",
    );
    expect(
      element('[data-slot="dropdown-menu-group"]').getAttribute("role"),
    ).toBe("group");
    expect(
      element('[data-slot="dropdown-menu-separator"]').getAttribute("role"),
    ).toBe("separator");
  });

  it("invokes an enabled item and closes the menu", async () => {
    await render();

    await click('[data-slot="dropdown-menu-item"]:not([data-disabled])');

    expect(selected).toHaveBeenCalledOnce();
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]'),
    ).toBeNull();
  });

  it("does not invoke a disabled destructive item", async () => {
    await render();

    const disabled = element('[data-slot="dropdown-menu-item"][data-disabled]');

    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.getAttribute("data-variant")).toBe("destructive");

    await act(async () => {
      disabled.click();
    });

    expect(selected).not.toHaveBeenCalled();
  });

  it("reports checkbox changes", async () => {
    await render();

    const checkbox = element('[role="menuitemcheckbox"]');
    expect(checkbox.getAttribute("aria-checked")).toBe("true");

    await click('[role="menuitemcheckbox"]');

    expect(checked).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("reports radio selection changes", async () => {
    await render();

    const radios = document.querySelectorAll<HTMLElement>(
      '[role="menuitemradio"]',
    );

    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios[1].getAttribute("aria-checked")).toBe("false");

    await act(async () => {
      radios[1].click();
    });

    expect(radioChanged).toHaveBeenCalledExactlyOnceWith("lowest");
  });

  it("opens a submenu through its trigger and renders its portal", async () => {
    await render();

    const trigger = element('[data-slot="dropdown-menu-sub-trigger"]');

    expect(trigger.textContent).toContain("More options");

    await act(async () => {
      trigger.click();
    });

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(
      element('[data-slot="dropdown-menu-sub-content"]').textContent,
    ).toContain("Additional setting");
  });
});
