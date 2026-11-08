// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SceneBoundary } from "@/components/hero/scene-boundary";

function FailingScene(): never {
  throw new Error("Loading chunk hero-scene failed");
}

describe("SceneBoundary", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("shows the scene when it starts", () => {
    act(() =>
      root.render(
        createElement(
          SceneBoundary,
          { fallback: createElement("p", null, "still card") },
          createElement("p", null, "3D scene"),
        ),
      ),
    );

    expect(container.textContent).toBe("3D scene");
  });

  it("shows the fallback instead of breaking the page when the scene fails", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() =>
      root.render(
        createElement(
          SceneBoundary,
          { fallback: createElement("p", null, "still card") },
          createElement(FailingScene),
        ),
      ),
    );

    expect(container.textContent).toBe("still card");
    expect(logged).toHaveBeenCalledWith(
      "The hero scene could not start:",
      expect.any(Error),
    );
  });
});
