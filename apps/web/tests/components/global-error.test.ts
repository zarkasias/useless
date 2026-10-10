// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GlobalError from "@/app/global-error";

let testDocument: Document;
let root: Root | undefined;

beforeEach(() => {
  root = undefined;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  testDocument = document.implementation.createHTMLDocument("Error test");
  root = createRoot(testDocument);
});

afterEach(async () => {
  try {
    await act(async () => {
      root?.unmount();
    });
  } finally {
    root = undefined;
    vi.unstubAllGlobals();
  }
});

async function render(
  error: Error = new Error("Private server details"),
  reset: () => void = vi.fn(),
) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Test root was not initialized");

  await act(async () => {
    activeRoot.render(createElement(GlobalError, { error, reset }));
  });
}

describe("GlobalError", () => {
  it("renders the recovery message inside a complete document", async () => {
    await render();

    expect(testDocument.documentElement.tagName).toBe("HTML");
    expect(testDocument.body.querySelector("main")).not.toBeNull();
    expect(testDocument.querySelector("h1")?.textContent).toBe(
      "Useless Achievements had a very useful error.",
    );
    expect(testDocument.querySelector("p")?.textContent).toBe(
      "Please try again.",
    );
  });

  it("does not expose the error message or digest", async () => {
    const error = Object.assign(new Error("Private database credentials"), {
      digest: "private-error-digest",
    });

    await render(error);

    expect(testDocument.body.textContent).not.toContain(error.message);
    expect(testDocument.body.textContent).not.toContain(error.digest);
  });

  it("calls reset when the user clicks Try Again", async () => {
    const reset = vi.fn();

    await render(new Error("Server failure"), reset);

    const button = testDocument.querySelector("button");
    if (!button) throw new Error("Missing Try Again button");

    expect(button.textContent).toBe("Try Again");
    expect(button.disabled).toBe(false);
    expect(reset).not.toHaveBeenCalled();

    await act(async () => {
      button.click();
    });

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
