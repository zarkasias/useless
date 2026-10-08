// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function render(error: Error, reset: () => void) {
  await act(async () => {
    root.render(createElement(ErrorPage, { error, reset }));
  });
}

describe("ErrorPage", () => {
  it("renders the recovery message without exposing error details", async () => {
    const error = new Error("Private database connection details");

    await render(error, vi.fn());

    expect(container.querySelector("main")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("Something Broke");
    expect(container.textContent).toContain(
      "You may have discovered an achievement we did not intend to create.",
    );
    expect(container.textContent).not.toContain(error.message);

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Try Again");
    expect(button?.disabled).toBe(false);
  });

  it("calls reset when the user clicks Try Again", async () => {
    const reset = vi.fn();

    await render(new Error("Something failed"), reset);

    expect(reset).not.toHaveBeenCalled();

    const button = container.querySelector("button");
    if (!button) throw new Error("Missing Try again button");

    await act(async () => {
      button.click();
    });

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the original error, including its digest", async () => {
    const error = Object.assign(new Error("Server rendering failed"), {
      digest: "server-error-123",
    });

    await render(error, vi.fn());

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(error);
    expect(container.textContent).not.toContain(error.digest);
  });

  it("logs a replacement error but does not log again for the same error", async () => {
    const reset = vi.fn();
    const firstError = new Error("First failure");
    const secondError = new Error("Second failure");

    await render(firstError, reset);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(1, firstError);

    await render(firstError, reset);

    expect(console.error).toHaveBeenCalledTimes(1);

    await render(secondError, reset);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(2, secondError);
    expect(reset).not.toHaveBeenCalled();
    expect(container.querySelector("h1")?.textContent).toBe("Something Broke");
  });
});
