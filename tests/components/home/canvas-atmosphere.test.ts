// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/home/home.module.css", () => ({ default: {} }));

import { CanvasAtmosphere } from "@/components/home/canvas-atmosphere";

let container: HTMLDivElement;
let root: Root;
let unmounted: boolean;
let hidden: boolean;
let nextFrame: number;
let frames: Map<number, FrameRequestCallback>;
let resizeCallback: ResizeObserverCallback;
let intersectionCallback: IntersectionObserverCallback;
let preference: MediaQueryList;
let preferenceChange: EventListener | undefined;

const context = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  save: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  restore: vi.fn(),
  globalAlpha: 1,
  fillStyle: "",
};

const resizeObserve = vi.fn();
const resizeDisconnect = vi.fn();
const intersectionObserve = vi.fn();
const intersectionDisconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  hidden = false;
  unmounted = false;
  nextFrame = 0;
  frames = new Map();
  preferenceChange = undefined;

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 400,
    bottom: 300,
    width: 400,
    height: 300,
    toJSON: () => ({}),
  });

  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );

  preference = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (_type: string, listener: EventListenerOrEventListenerObject) => {
        preferenceChange = listener as EventListener;
      },
    ),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockReturnValue(preference);

  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    }),
  );

  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id)),
  );

  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe = resizeObserve;
      unobserve = vi.fn();
      disconnect = resizeDisconnect;
    },
  );

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }
      observe = intersectionObserve;
      unobserve = vi.fn();
      disconnect = intersectionDisconnect;
    },
  );
});

afterEach(async () => {
  if (!unmounted) {
    await act(async () => root.unmount());
  }
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function render(pulse = 0) {
  await act(async () => {
    root.render(createElement(CanvasAtmosphere, { pulse }));
  });
}

function advanceFrame(time = 16) {
  const pending = Array.from(frames.values());
  frames.clear();

  for (const callback of pending) {
    callback(time);
  }
}

function setVisible(isIntersecting: boolean) {
  intersectionCallback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

describe("homepage canvas atmosphere", () => {
  it("renders a decorative canvas and sizes it for the host", async () => {
    await render();

    const canvas = container.querySelector("canvas");
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.width).toBe(Math.round(400 * ratio));
    expect(canvas?.height).toBe(Math.round(300 * ratio));
    expect(resizeObserve).toHaveBeenCalledWith(container);
    expect(intersectionObserve).toHaveBeenCalledWith(container);

    advanceFrame();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
    expect(frames.size).toBe(1);
  });

  it("handles an unavailable canvas context without starting animation", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    await render();

    expect(container.querySelector("canvas")).not.toBeNull();
    expect(frames.size).toBe(0);
    expect(resizeObserve).not.toHaveBeenCalled();
    expect(intersectionObserve).not.toHaveBeenCalled();
  });

  it("draws one static frame when reduced motion is enabled", async () => {
    Object.defineProperty(preference, "matches", {
      configurable: true,
      value: true,
    });

    await render();
    advanceFrame();

    expect(context.clearRect).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("pauses offscreen and resumes when visible", async () => {
    await render();

    setVisible(false);
    expect(frames.size).toBe(0);

    setVisible(true);
    expect(frames.size).toBe(1);

    advanceFrame();
    expect(context.clearRect).toHaveBeenCalledTimes(1);
  });

  it("pauses when the document is hidden and resumes when shown", async () => {
    await render();

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0);

    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(1);
  });

  it("adds a burst when the pulse changes", async () => {
    await render();
    advanceFrame(16);

    context.fillRect.mockClear();

    await render(1);
    advanceFrame(32);

    const burstRects = context.fillRect.mock.calls.filter(
      (call) => call[2] === 5 && call[3] === 8,
    );

    expect(burstRects).toHaveLength(42);
  });

  it("redraws after a resize", async () => {
    await render();
    advanceFrame();
    context.setTransform.mockClear();
    context.clearRect.mockClear();

    resizeCallback([], {} as ResizeObserver);
    advanceFrame(32);

    expect(context.setTransform).toHaveBeenCalledTimes(1);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
  });

  it("stops continuous animation when reduced motion changes", async () => {
    await render();
    advanceFrame();

    Object.defineProperty(preference, "matches", {
      configurable: true,
      value: true,
    });

    expect(preferenceChange).toBeDefined();
    preferenceChange?.(new Event("change"));
    advanceFrame(32);

    expect(frames.size).toBe(0);
  });

  it("disconnects observers, removes listeners, and cancels frames on unmount", async () => {
    const removeHostListener = vi.spyOn(container, "removeEventListener");
    const removeDocumentListener = vi.spyOn(document, "removeEventListener");

    await render();

    await act(async () => root.unmount());
    unmounted = true;

    expect(frames.size).toBe(0);
    expect(resizeDisconnect).toHaveBeenCalledTimes(1);
    expect(intersectionDisconnect).toHaveBeenCalledTimes(1);
    expect(removeHostListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(removeHostListener).toHaveBeenCalledWith(
      "pointerleave",
      expect.any(Function),
    );
    expect(removeDocumentListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(preference.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
