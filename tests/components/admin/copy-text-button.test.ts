// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyTextButton } from "@/components/admin/copy-text-button";

let container: HTMLDivElement | undefined;
let root: Root | undefined;
let originalClipboard: PropertyDescriptor | undefined;

const writeText = vi.fn();

beforeEach(() => {
  container = undefined;
  root = undefined;
  originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

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

    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }

    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

async function render(text: string, label = "Copy ID") {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Test root was not initialized");

  await act(async () => {
    activeRoot.render(createElement(CopyTextButton, { text, label }));
  });
}

function getButton(): HTMLButtonElement {
  const button = container?.querySelector("button");
  if (!button) throw new Error("Missing copy button");
  return button;
}

describe("CopyTextButton", () => {
  it("renders the supplied label and enables copying", async () => {
    await render("achievement-123");

    expect(getButton().textContent).toBe("Copy ID");
    expect(getButton().disabled).toBe(false);
    expect(getButton().type).toBe("button");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the exact text and shows confirmation", async () => {
    const text = "Achievement title\nDetails with punctuation: !";
    await render(text, "Copy details");

    await act(async () => {
      getButton().click();
    });

    expect(writeText).toHaveBeenCalledExactlyOnceWith(text);
    expect(getButton().textContent).toBe("Copied");
  });

  it("restores the label after 1500 milliseconds", async () => {
    await render("achievement-123");

    await act(async () => {
      getButton().click();
    });

    await act(async () => {
      vi.advanceTimersByTime(1499);
    });

    expect(getButton().textContent).toBe("Copied");

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(getButton().textContent).toBe("Copy ID");
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("disables the button when there is no text to copy", async () => {
    await render("");

    expect(getButton().disabled).toBe(true);

    await act(async () => {
      getButton().click();
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(getButton().textContent).toBe("Copy ID");
  });
});
