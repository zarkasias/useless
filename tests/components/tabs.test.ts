// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        Tabs,
        { defaultValue: "profile", className: "custom-tabs" },
        createElement(
          TabsList,
          {
            "aria-label": "Settings sections",
            className: "custom-list",
          },
          createElement(
            TabsTrigger,
            { value: "profile", className: "custom-trigger" },
            "Profile",
          ),
          createElement(TabsTrigger, { value: "billing" }, "Billing"),
          createElement(
            TabsTrigger,
            { value: "unavailable", disabled: true },
            "Unavailable",
          ),
        ),
        createElement(
          TabsContent,
          { value: "profile", className: "custom-panel" },
          "Profile settings",
        ),
        createElement(TabsContent, { value: "billing" }, "Billing settings"),
        createElement(
          TabsContent,
          { value: "unavailable" },
          "Unavailable settings",
        ),
      ),
    );
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

function tab(label: string) {
  const element = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ).find((candidate) => candidate.textContent === label);

  if (!element) {
    throw new Error(`Missing tab: ${label}`);
  }

  return element;
}

describe("Tabs", () => {
  it("selects the default tab and associates it with its panel", () => {
    const selected = tab("Profile");
    const panelId = selected.getAttribute("aria-controls");

    expect(selected.getAttribute("aria-selected")).toBe("true");
    expect(panelId).toBeTruthy();

    const panel = document.getElementById(panelId!);

    expect(panel?.getAttribute("role")).toBe("tabpanel");
    expect(panel?.getAttribute("aria-labelledby")).toBe(selected.id);
    expect(panel?.textContent).toBe("Profile settings");
    expect(
      container.querySelector('[role="tablist"]')?.getAttribute("aria-label"),
    ).toBe("Settings sections");

    for (const [slot, className] of [
      ["tabs", "custom-tabs"],
      ["tabs-list", "custom-list"],
      ["tabs-trigger", "custom-trigger"],
      ["tabs-content", "custom-panel"],
    ]) {
      expect(
        container
          .querySelector(`[data-slot="${slot}"]`)
          ?.classList.contains(className),
      ).toBe(true);
    }
  });

  it("switches panels when a tab is activated with Enter", async () => {
    await act(async () => {
      tab("Billing").dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        }),
      );
    });

    expect(tab("Billing").getAttribute("aria-selected")).toBe("true");
    expect(tab("Profile").getAttribute("aria-selected")).toBe("false");

    const panelId = tab("Billing").getAttribute("aria-controls");

    expect(document.getElementById(panelId!)?.textContent).toBe(
      "Billing settings",
    );
    expect(container.textContent).not.toContain("Profile settings");
  });

  it("does not activate a disabled tab", async () => {
    expect(tab("Unavailable").disabled).toBe(true);

    await act(async () => {
      tab("Unavailable").click();
    });

    expect(tab("Profile").getAttribute("aria-selected")).toBe("true");
    expect(tab("Unavailable").getAttribute("aria-selected")).toBe("false");
    expect(container.textContent).not.toContain("Unavailable settings");
  });
});
