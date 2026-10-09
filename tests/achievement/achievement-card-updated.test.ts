// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  loading: vi.fn(),
  dismiss: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mocks,
}));

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: {
    className: "fredoka",
    style: { fontFamily: "Fredoka" },
  },
  nunito: {
    className: "nunito",
    style: { fontFamily: "Nunito" },
  },
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) =>
    createElement("img", {
      src,
      alt,
      width,
      height,
      className,
    }),
}));

import { AchievementCard } from "@/components/achievement-card-updated";

type Props = Parameters<typeof AchievementCard>[0];

const achievement: Achievement = {
  id: "achievement-123",
  title: "Successfully Did Nothing",
  description: "An unnecessary accomplishment.",
  type: "COMMON",
  emoji: "🏆",
  created_at: "2026-10-07T12:00:00.000Z",
  is_secret: false,
  trigger_type: "daily_claim",
  trigger_config: {},
  status: "published",
};

const imageUrl = "data:image/png;base64,dGVzdA==";

function createCanvasContext() {
  return {
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    roundRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 6,
    })),
  };
}

let container: HTMLDivElement | undefined;
let root: Root | undefined;
let context: ReturnType<typeof createCanvasContext>;

const fetchImage = vi.fn();
const share = vi.fn();
const canShare = vi.fn();

async function render(overrides: Partial<Props> = {}) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(AchievementCard, {
        achievement,
        isCollected: true,
        ...overrides,
      }),
    );
  });
}

function button(label: string): HTMLButtonElement {
  const result = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) => element.textContent?.trim() === label,
  );

  if (!result) throw new Error(`Missing button: ${label}`);
  return result;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.loading.mockReturnValue("preparing-toast");

  fetchImage.mockReset();
  fetchImage.mockResolvedValue({
    blob: async () => new Blob(["test-image"], { type: "image/png" }),
  });

  share.mockReset();
  share.mockResolvedValue(undefined);
  canShare.mockReset();
  canShare.mockReturnValue(true);

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetchImage);
  vi.stubGlobal("navigator", { share, canShare });
  vi.stubGlobal("devicePixelRatio", 1);

  context = createCanvasContext();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(imageUrl);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

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
    container = undefined;
    root = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

describe("AchievementCard", () => {
  it("renders the achievement and emoji without generating a share image", async () => {
    await render();

    expect(container?.textContent).toContain(achievement.title);
    expect(container?.textContent).toContain(achievement.description);
    expect(
      container?.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toBe(`${achievement.title} achievement`);
    expect(container?.querySelector('[role="img"]')?.textContent).toBe("🏆");
    expect(container?.querySelector("button")).toBeNull();
    expect(fetchImage).not.toHaveBeenCalled();
    expect(mocks.loading).not.toHaveBeenCalled();
  });

  it("renders an image icon instead of the emoji", async () => {
    await render({
      achievement: {
        ...achievement,
        icon_path: "/icons/trophy.png",
      },
    });

    const icon = container?.querySelector("img");

    expect(icon?.getAttribute("src")).toBe("/icons/trophy.png");
    expect(icon?.getAttribute("alt")).toBe(`${achievement.title} achievement`);
    expect(container?.querySelector('[role="img"]')).toBeNull();
  });

  it("applies compact title and description styling", async () => {
    await render({ variant: "compact" });

    const title = container?.querySelector('[data-slot="card-title"]');
    const description = container?.querySelector(
      '[data-slot="card-description"]',
    );

    expect(title?.classList.contains("text-base")).toBe(true);
    expect(description?.classList.contains("line-clamp-2")).toBe(true);
  });

  it("generates one PNG automatically and enables sharing and downloading", async () => {
    await render({ showShareButton: true });

    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith(
      "image/png",
      1,
    );
    expect(context.scale).toHaveBeenCalledWith(2, 2);
    expect(context.fillText).toHaveBeenCalledWith(
      achievement.emoji,
      expect.any(Number),
      expect.any(Number),
    );
    expect(fetchImage).toHaveBeenCalledExactlyOnceWith(imageUrl);
    expect(mocks.loading).toHaveBeenCalledWith(
      "Preparing achievement to share...",
      { description: "This will only take a moment" },
    );
    expect(mocks.dismiss).toHaveBeenCalledWith("preparing-toast");
    expect(button("Share").disabled).toBe(false);

    await render({ showShareButton: true });

    expect(fetchImage).toHaveBeenCalledTimes(1);
  });

  it("keeps sharing and downloading disabled for uncollected achievements", async () => {
    await render({ showShareButton: true, isCollected: false });

    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(button("Share").disabled).toBe(true);
  });

  it("generates grid images without showing a preparation toast", async () => {
    await render({ showShareButton: true, ingrid: true });

    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(mocks.loading).not.toHaveBeenCalled();
    expect(mocks.dismiss).not.toHaveBeenCalled();
    expect(button("Share").disabled).toBe(false);
  });

  it("shows the loading state until the image file is ready", async () => {
    let resolveBlob!: (blob: Blob) => void;

    fetchImage.mockResolvedValue({
      blob: () =>
        new Promise<Blob>((resolve) => {
          resolveBlob = resolve;
        }),
    });

    await render({ showShareButton: true });

    expect(container?.textContent).toContain("Preparing your achievement...");
    expect(button("Share").disabled).toBe(true);

    await act(async () => {
      resolveBlob(new Blob(["test-image"], { type: "image/png" }));
    });

    expect(container?.textContent).not.toContain(
      "Preparing your achievement...",
    );
    expect(button("Share").disabled).toBe(false);
  });

  it("offers a retry after canvas generation fails", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValueOnce(null);

    await render({ showShareButton: true });

    expect(mocks.error).toHaveBeenCalledWith("Failed to prepare image", {
      description:
        "Try switching between light/dark mode or using a different browser",
    });
    expect(mocks.dismiss).toHaveBeenCalledWith("preparing-toast");

    // A changed prop makes the memoized card render again,
    // exposing the retry UI controlled by generationAttemptedRef.
    await render({ showShareButton: true, variant: "compact" });

    expect(button("Try Again").disabled).toBe(false);
    expect(button("Share").disabled).toBe(true);

    await click("Try Again");

    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(button("Share").disabled).toBe(false);
    expect(
      Array.from(container?.querySelectorAll("button") ?? []).some(
        (element) => element.textContent?.trim() === "Try Again",
      ),
    ).toBe(false);
  });

  it("shares the generated PNG when file sharing is supported", async () => {
    await render({ showShareButton: true });
    await click("Share");

    expect(share).toHaveBeenCalledTimes(1);

    const payload = share.mock.calls[0]![0] as ShareData;
    const file = payload.files?.[0];

    expect(payload.title).toBe(
      "Successfully Did Nothing - Useless Achievements",
    );
    expect(payload.text).toBe(
      'I just unlocked "Successfully Did Nothing" on Useless Achievements!',
    );
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe("achievement-successfully-did-nothing.png");
    expect(file?.type).toBe("image/png");
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(button("Share").disabled).toBe(false);
  });

  it("shares text when the browser cannot share image files", async () => {
    canShare.mockReturnValue(false);

    await render({ showShareButton: true });
    await click("Share");

    expect(share).toHaveBeenCalledExactlyOnceWith({
      title: "Successfully Did Nothing - Useless Achievements",
      text: 'I just unlocked "Successfully Did Nothing" on Useless Achievements!',
    });
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("suggests downloading when browser sharing is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await render({ showShareButton: true });
    await click("Share");

    expect(mocks.info).toHaveBeenCalledWith(
      "Sharing is not supported in this browser",
      { description: "Download the image and share it manually." },
    );
    expect(button("Share").disabled).toBe(false);
  });

  it("treats a cancelled share as a normal dismissal", async () => {
    share.mockRejectedValue(new DOMException("User cancelled", "AbortError"));

    await render({ showShareButton: true });
    await click("Share");

    expect(mocks.error).not.toHaveBeenCalled();
    expect(button("Share").disabled).toBe(false);
  });

  it("reports other share errors and restores the controls", async () => {
    share.mockRejectedValue(new Error("Share unavailable"));

    await render({ showShareButton: true });
    await click("Share");

    expect(mocks.error).toHaveBeenCalledWith("Unable to share achievement", {
      description: "Try downloading the image instead.",
    });
    expect(button("Share").disabled).toBe(false);
  });

  it.each(["loaded", "failed"] as const)(
    "generates a share image when the achievement icon is %s",
    async (outcome) => {
      let requestedSource = "";

      class MockImage {
        onload: (() => void) | null = null;
        onerror: ((event: Event) => void) | null = null;

        set src(value: string) {
          requestedSource = value;

          queueMicrotask(() => {
            if (outcome === "loaded") {
              this.onload?.();
            } else {
              this.onerror?.(new Event("error"));
            }
          });
        }
      }

      vi.stubGlobal("Image", MockImage);

      await render({
        showShareButton: true,
        achievement: {
          ...achievement,
          icon_path: "/icons/trophy.png",
        },
      });

      expect(requestedSource).toBe("/icons/trophy.png");
      expect(fetchImage).toHaveBeenCalledExactlyOnceWith(imageUrl);
      expect(button("Share").disabled).toBe(false);

      if (outcome === "loaded") {
        expect(context.drawImage).toHaveBeenCalledWith(
          expect.any(MockImage),
          248,
          14,
          88,
          88,
        );
        expect(context.fillText).not.toHaveBeenCalledWith(
          achievement.emoji,
          expect.any(Number),
          expect.any(Number),
        );
      } else {
        expect(context.drawImage).not.toHaveBeenCalled();
        expect(context.fillText).toHaveBeenCalledWith(
          achievement.emoji,
          expect.any(Number),
          expect.any(Number),
        );
        expect(console.error).toHaveBeenCalledWith(
          "Failed to load achievement icon:",
          expect.any(Event),
        );
        expect(mocks.error).not.toHaveBeenCalled();
      }
    },
  );

  it.each(["light", "dark"] as const)(
    "includes the unlocked date in a generated %s-mode image",
    async (mode) => {
      const originallyDark =
        document.documentElement.classList.contains("dark");

      document.documentElement.classList.toggle("dark", mode === "dark");

      try {
        await render({
          showShareButton: true,
          unlockedAt: "2026-10-07T12:00:00.000Z",
        });

        expect(context.fillText).toHaveBeenCalledWith(
          expect.stringMatching(/^Unlocked .+/),
          20,
          158,
        );
        expect(fetchImage).toHaveBeenCalledExactlyOnceWith(imageUrl);
        expect(button("Share").disabled).toBe(false);
      } finally {
        document.documentElement.classList.toggle("dark", originallyDark);
      }
    },
  );

  it("uses the device pixel ratio when it exceeds the minimum scale", async () => {
    vi.stubGlobal("devicePixelRatio", 3);

    await render({ showShareButton: true });

    expect(context.scale).toHaveBeenCalledExactlyOnceWith(3, 3);

    const canvas = vi.mocked(HTMLCanvasElement.prototype.toDataURL).mock
      .contexts[0] as HTMLCanvasElement;

    expect(canvas.width).toBe(1050);
    expect(canvas.height).toBe(690);
  });

  it("truncates long titles and descriptions to their canvas line limits", async () => {
    const longText = Array(12).fill("abcdefghijklmnopqrst").join(" ");

    await render({
      showShareButton: true,
      achievement: {
        ...achievement,
        title: longText,
        description: longText,
      },
    });

    // Title: two lines, starting at y=67 with a line height of 19.
    expect(context.fillText).toHaveBeenCalledWith(
      expect.stringMatching(/\.\.\.$/),
      20,
      86,
    );

    // Description: three lines, starting at y=94 with a line height of 16.
    expect(context.fillText).toHaveBeenCalledWith(
      expect.stringMatching(/\.\.\.$/),
      20,
      126,
    );

    expect(button("Share").disabled).toBe(false);
  });

  it("shares text when the browser has share but no canShare API", async () => {
    vi.stubGlobal("navigator", { share });

    await render({ showShareButton: true });
    await click("Share");

    expect(share).toHaveBeenCalledExactlyOnceWith({
      title: "Successfully Did Nothing - Useless Achievements",
      text: 'I just unlocked "Successfully Did Nothing" on Useless Achievements!',
    });
    expect(canShare).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("suppresses generation error toasts for cards displayed in a grid", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValueOnce(null);

    await render({ showShareButton: true, ingrid: true });

    expect(console.error).toHaveBeenCalledWith(
      "Error generating image:",
      expect.any(Error),
    );
    expect(mocks.loading).not.toHaveBeenCalled();
    expect(mocks.error).not.toHaveBeenCalled();
    expect(fetchImage).not.toHaveBeenCalled();

    // Render again to expose the ref-controlled retry button.
    await render({
      showShareButton: true,
      ingrid: true,
      variant: "compact",
    });

    expect(button("Try Again").disabled).toBe(false);
  });
});
