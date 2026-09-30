// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useMobileCardMotion } from "../src/components/games/solitaire/klondike/use-mobile-card-motion";
import type { KlondikeBoardState } from "../src/lib/games/solitaire/klondike/klondike-types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

it.each([false, true])("animates a moved stack and respects reduced motion (%s)", (reduced) => {
  const animations: { cancel: ReturnType<typeof vi.fn> }[] = [];
  const animate = vi.fn(() => {
    const animation = { cancel: vi.fn() };
    animations.push(animation);
    return animation;
  });
  const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: reduced }) });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
    return { left: Number(this.dataset.x ?? 0), top: Number(this.dataset.y ?? 0), width: 40, height: 56 } as DOMRect;
  });
  let board = { stock: [], waste: [], foundations: [], tableau: [] } as KlondikeBoardState;
  let x = 0;
  function Harness() {
    const ref = useMobileCardMotion(board);
    return createElement("div", { ref }, [0, 1].map(index => createElement("button", {
      key: index, "data-mobile-card-id": `card-${index}`, "data-x": x, "data-y": index * 28,
    })));
  }
  const root = createRoot(document.createElement("div"));
  try {
    act(() => root.render(createElement(Harness)));
    expect(animate).not.toHaveBeenCalled();
    x = 100;
    board = { ...board };
    act(() => root.render(createElement(Harness)));
    expect(animate).toHaveBeenCalledTimes(reduced ? 0 : 2);
    if (!reduced) {
      expect(animate.mock.calls[0]).toEqual([
        [
          { transform: "translate(-100px, 0px) scale(1, 1)", transformOrigin: "top left" },
          { transform: "none", transformOrigin: "top left" },
        ],
        { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      ]);
    }
  } finally {
    act(() => root.unmount());
    animations.forEach(animation => expect(animation.cancel).toHaveBeenCalled());
    if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
    else Reflect.deleteProperty(HTMLElement.prototype, "animate");
    if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
    else Reflect.deleteProperty(window, "matchMedia");
    vi.restoreAllMocks();
  }
});
