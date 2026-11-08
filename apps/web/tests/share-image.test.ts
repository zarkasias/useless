// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { style: { fontFamily: "Fredoka" } },
  nunito: { style: { fontFamily: "Nunito" } },
}));

import {
  createShareFile,
  getShareCaption,
  renderCardFace,
  renderShareImage,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_WIDTH,
  type ShareImageInput,
} from "@/lib/share-image";

const input: ShareImageInput = {
  title: "Successfully Did Nothing",
  description: "An unnecessary accomplishment.",
  type: "EPIC",
  emoji: "🏆",
  iconUrl: null,
};

let emojiFont = "";

function createContext() {
  const fillStyles: unknown[] = [];

  return {
    fillStyles,
    font: "",
    textAlign: "",
    textBaseline: "",
    imageSmoothingQuality: "",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    set fillStyle(value: unknown) {
      fillStyles.push(value);
    },
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn<(text: string, x: number, y: number) => void>(function (
      this: { font: string },
      text,
    ) {
      if (text === "🏆") emojiFont = this.font;
    }),
    measureText(this: { font: string; textAlign: string }, text: string) {
      const size = Number(/(\d+)px/.exec(this.font)?.[1] ?? 10);
      // Like a real canvas, horizontal metrics depend on the text alignment.
      const alignShift = this.textAlign === "center" ? 100 : 0;

      return {
        width: text.length * size * 0.5,
        // A glyph whose visible pixels are offset from its reported position.
        actualBoundingBoxLeft: 10 + alignShift,
        actualBoundingBoxRight: size + 30 - alignShift,
        actualBoundingBoxAscent: size,
        actualBoundingBoxDescent: 20,
      };
    },
  };
}

function stubImage(outcome: "load" | "error", width = 200, height = 200) {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    crossOrigin = "";
    naturalWidth = width;
    naturalHeight = height;

    set src(_value: string) {
      queueMicrotask(() => {
        if (outcome === "load") this.onload?.();
        else this.onerror?.(new Event("error"));
      });
    }
  }

  vi.stubGlobal("Image", MockImage);
}

let context: ReturnType<typeof createContext>;
let loadFont: ReturnType<typeof vi.fn>;
let getContext: ReturnType<typeof vi.fn>;

const drawnText = () =>
  context.fillText.mock.calls.map((call) => call[0] as string);

beforeEach(() => {
  context = createContext();
  loadFont = vi.fn().mockResolvedValue([]);
  getContext = vi.fn(() => context);

  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { load: loadFont },
  });

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    getContext as unknown as HTMLCanvasElement["getContext"],
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    callback,
  ) {
    callback(new Blob(["image"], { type: "image/png" }));
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("dark");
});

describe("renderShareImage", () => {
  it("produces a fixed-size PNG whatever the device pixel ratio", async () => {
    vi.stubGlobal("devicePixelRatio", 3);

    const blob = await renderShareImage(input);
    const canvas = vi.mocked(HTMLCanvasElement.prototype.toBlob).mock
      .contexts[0] as HTMLCanvasElement;

    expect(blob.type).toBe("image/png");
    expect(canvas.width).toBe(SHARE_IMAGE_WIDTH);
    expect(canvas.height).toBe(SHARE_IMAGE_HEIGHT);
    expect(context.scale).not.toHaveBeenCalled();
  });

  it("draws the same image in light and dark mode", async () => {
    await renderShareImage(input);

    const lightText = context.fillText.mock.calls;
    const lightStyles = context.fillStyles;

    context = createContext();
    getContext.mockImplementation(() => context);
    document.documentElement.classList.add("dark");

    await renderShareImage(input);

    expect(context.fillText.mock.calls).toEqual(lightText);
    expect(context.fillStyles.filter((s) => typeof s === "string")).toEqual(
      lightStyles.filter((s) => typeof s === "string"),
    );
  });

  it("includes the achievement and branding but no share caption or time", async () => {
    await renderShareImage(input);

    const text = drawnText();

    expect(text).toEqual(
      expect.arrayContaining([
        "EPIC",
        "An unnecessary accomplishment.",
        "Useless Achievements",
        "uselessachievements.com",
      ]),
    );
    expect(text.join(" ")).toContain("Successfully");
    expect(text.join(" ")).not.toMatch(/just unlocked|Unlocked/i);
  });

  it("waits for the brand fonts before drawing", async () => {
    let finishLoading!: () => void;

    loadFont.mockReturnValue(
      new Promise<void>((resolve) => {
        finishLoading = resolve;
      }),
    );

    const rendering = renderShareImage(input);

    await Promise.resolve();

    expect(loadFont).toHaveBeenCalledWith(expect.stringContaining("Fredoka"));
    expect(loadFont).toHaveBeenCalledWith(expect.stringContaining("Nunito"));
    expect(getContext).not.toHaveBeenCalled();

    finishLoading();
    await rendering;

    expect(getContext).toHaveBeenCalledOnce();
  });

  it("still draws the image when fonts do not load in time", async () => {
    vi.useFakeTimers();
    loadFont.mockReturnValue(new Promise(() => {}));

    const rendering = renderShareImage(input);

    await vi.advanceTimersByTimeAsync(3000);

    await expect(rendering).resolves.toBeInstanceOf(Blob);
    expect(console.error).toHaveBeenCalled();
  });

  it("draws the icon without stretching it and leaves out the emoji", async () => {
    stubImage("load", 200, 100);

    await renderShareImage({ ...input, iconUrl: "https://example.com/i.webp" });

    const [, , , width, height] = context.drawImage.mock.calls[0]!;

    expect(width / height).toBe(2);
    expect(drawnText()).not.toContain(input.emoji);
  });

  it("falls back to the emoji when the icon fails to load", async () => {
    stubImage("error");

    await renderShareImage({ ...input, iconUrl: "https://example.com/i.webp" });

    expect(context.drawImage).not.toHaveBeenCalled();
    expect(drawnText()).toContain(input.emoji);
  });

  it("centers the emoji on its visible pixels inside the medallion", async () => {
    await renderShareImage(input);

    const [centerX, centerY] = context.arc.mock.calls[0]!;
    const emojiCall = context.fillText.mock.calls.find(
      (call) => call[0] === input.emoji,
    )!;
    const fontSize = Number(/(\d+)px/.exec(emojiFont)?.[1]);

    expect(emojiCall[1] + (fontSize + 30 - 10) / 2).toBe(centerX);
    expect(emojiCall[2] + (20 - fontSize) / 2).toBe(centerY);
  });

  it("falls back to the emoji when the icon never loads", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "Image",
      class {
        set src(_value: string) {}
      },
    );

    const rendering = renderShareImage({
      ...input,
      iconUrl: "https://example.com/i.webp",
    });

    await vi.advanceTimersByTimeAsync(5000);
    await rendering;

    expect(drawnText()).toContain(input.emoji);
  });

  it("cuts off long text with an ellipsis and keeps every line inside the card", async () => {
    const longText = Array(40).fill("nothing").join(" ");

    await renderShareImage({ ...input, title: longText, description: longText });

    const ellipses = drawnText().filter((text) => text.endsWith("..."));

    expect(ellipses).toHaveLength(2);

    for (const [text, , y] of context.fillText.mock.calls) {
      if (text === "Useless Achievements") continue;
      if (text === "uselessachievements.com") continue;

      expect(y).toBeGreaterThan(80);
      expect(y).toBeLessThan(1100);
    }

    // The icon medallion keeps a usable size beside the longest allowed text.
    expect(context.arc.mock.calls[0]![2]).toBeGreaterThan(80);
  });

  it("breaks a word that is too wide for one line", async () => {
    const word = "a".repeat(60);

    await renderShareImage({ ...input, title: word });

    const parts = drawnText().filter((text) => /^a+$/.test(text));

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join("")).toBe(word);
  });

  it("lets the rarity color show through the card, as it does in the app", async () => {
    await renderShareImage(input);

    expect(context.fillStyles).toContain("rgba(249, 250, 251, 0.80)");
  });

  it("creates a PNG file with a safe name", async () => {
    const file = await createShareFile({ ...input, title: "Did it! / Why? 🏆" });

    expect(file.name).toBe("achievement-did-it-why.png");
    expect(file.type).toBe("image/png");
  });

  it("names the file sensibly when a title has no usable characters", async () => {
    const file = await createShareFile({ ...input, title: "🏆🏆" });

    expect(file.name).toBe("achievement.png");
  });

  it("writes the share caption", () => {
    expect(getShareCaption("Did Nothing")).toBe(
      'I just unlocked "Did Nothing" on Useless Achievements! https://www.uselessachievements.com',
    );
  });

  it("rejects when the browser cannot provide a canvas context", async () => {
    getContext.mockReturnValue(null);

    await expect(renderShareImage(input)).rejects.toThrow(
      "Could not get canvas context",
    );
  });
});

describe("renderCardFace", () => {
  it("draws just the card at the requested 4:5 size, scaled from the share layout", async () => {
    const canvas = await renderCardFace(input, 820, 1024);

    expect([canvas.width, canvas.height]).toEqual([820, 1024]);
    expect(context.scale).toHaveBeenCalledWith(
      820 / SHARE_IMAGE_WIDTH,
      1024 / SHARE_IMAGE_HEIGHT,
    );
  });

  it("shows the achievement and a small wordmark, but not the share footer's site address", async () => {
    await renderCardFace(input);

    expect(drawnText().join(" ")).toContain("Successfully Did Nothing");
    expect(drawnText()).toContain("Useless Achievements");
    expect(drawnText()).not.toContain("uselessachievements.com");
  });

  it("leaves the share image itself unchanged", async () => {
    await renderShareImage(input);

    expect(drawnText()).toContain("uselessachievements.com");
  });
});
