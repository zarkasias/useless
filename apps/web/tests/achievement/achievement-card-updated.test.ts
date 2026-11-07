// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const toasts = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const createShareFile = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: toasts }));

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "fredoka", style: { fontFamily: "Fredoka" } },
  nunito: { className: "nunito", style: { fontFamily: "Nunito" } },
}));

vi.mock("@/lib/share-image", () => ({
  createShareFile,
  getShareCaption: (title: string) => `Caption for ${title}`,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
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

const file = new File(["image"], "achievement.png", { type: "image/png" });

let container: HTMLDivElement | undefined;
let root: Root | undefined;
let observers: {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
}[];

const share = vi.fn();
const canShare = vi.fn();
const writeText = vi.fn();

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

function shareButton(): HTMLButtonElement {
  const result = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) => /^(Share|Download)$/.test(element.textContent?.trim() ?? ""),
  );

  if (!result) throw new Error("Missing Share button");
  return result;
}

async function tapShare() {
  await act(async () => {
    shareButton().click();
  });
}

async function scrollIntoView(index = 0) {
  await act(async () => {
    observers[index]!.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
}

beforeEach(() => {
  observers = [];

  for (const mock of Object.values(toasts)) mock.mockReset();

  createShareFile.mockReset();
  createShareFile.mockResolvedValue(file);
  share.mockReset();
  share.mockResolvedValue(undefined);
  canShare.mockReset();
  canShare.mockReturnValue(true);
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("navigator", {
    share,
    canShare,
    clipboard: { writeText },
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();

      constructor(callback: IntersectionObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect });
      }
    },
  );

  URL.createObjectURL = vi.fn(() => "blob:share-image");
  URL.revokeObjectURL = vi.fn();
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

describe("AchievementCard display", () => {
  it("renders the achievement and emoji without a share image", async () => {
    await render();

    expect(container?.textContent).toContain(achievement.title);
    expect(container?.textContent).toContain(achievement.description);
    expect(
      container?.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toBe(`${achievement.title} achievement`);
    expect(container?.querySelector("button")).toBeNull();
    expect(createShareFile).not.toHaveBeenCalled();
  });

  it("renders an image icon instead of the emoji", async () => {
    await render({
      achievement: { ...achievement, icon_path: "/icons/trophy.png" },
    });

    expect(container?.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.supabase.co/storage/v1/object/public/achievement-assets/icons/trophy.png",
    );
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

  it.each(["default", "compact", "enlarged"] as const)(
    "lets %s titles wrap instead of running into the icon",
    async (variant) => {
      await render({ variant });

      const title = container?.querySelector('[data-slot="card-title"]');

      expect(title?.classList.contains("whitespace-nowrap")).toBe(false);
      expect(title?.parentElement?.classList.contains("min-w-0")).toBe(true);
    },
  );

  it("centers the content in the stacked variant", async () => {
    await render({ variant: "stacked" });

    const header = container?.querySelector('[data-slot="card-header"]');

    expect(header?.classList.contains("text-center")).toBe(true);
    expect(container?.textContent).toContain(achievement.title);
    expect(container?.querySelector('[role="img"]')?.textContent).toBe("🏆");
  });

  it("uses readable badge text on the amber Legendary badge", async () => {
    await render({ achievement: { ...achievement, type: "LEGENDARY" } });

    const badge = Array.from(container?.querySelectorAll("span") ?? []).find(
      (element) => element.textContent === "Legendary",
    );

    expect(badge?.style.color).toBe("rgb(69, 26, 3)");
    expect(badge?.classList.contains("fredoka")).toBe(true);
  });
});

describe("AchievementCard share image timing", () => {
  it("prepares the image straight away outside of grids", async () => {
    await render({ showShareButton: true });

    expect(createShareFile).toHaveBeenCalledExactlyOnceWith({
      title: achievement.title,
      description: achievement.description,
      type: achievement.type,
      emoji: achievement.emoji,
      iconUrl: null,
    });
    expect(shareButton().disabled).toBe(false);
  });

  it("waits until a grid card is visible before preparing its image", async () => {
    await render({ showShareButton: true, ingrid: true });

    expect(createShareFile).not.toHaveBeenCalled();
    expect(shareButton().disabled).toBe(true);

    await scrollIntoView();

    expect(createShareFile).toHaveBeenCalledOnce();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
    expect(shareButton().disabled).toBe(false);
  });

  it("never prepares an image for a locked card", async () => {
    await render({ showShareButton: true, isCollected: false, ingrid: true });

    expect(observers).toHaveLength(0);
    expect(createShareFile).not.toHaveBeenCalled();
    expect(shareButton().disabled).toBe(true);
  });

  it("keeps Share disabled and shows a spinner until the image is ready", async () => {
    let finish!: (value: File) => void;

    createShareFile.mockReturnValue(
      new Promise<File>((resolve) => {
        finish = resolve;
      }),
    );

    await render({ showShareButton: true });

    expect(shareButton().disabled).toBe(true);
    expect(container?.querySelector(".animate-spin")).not.toBeNull();

    await act(async () => {
      finish(file);
    });

    expect(shareButton().disabled).toBe(false);
    expect(container?.querySelector(".animate-spin")).toBeNull();
  });

  it("renders images one at a time when several cards appear together", async () => {
    let finishFirst!: (value: File) => void;

    createShareFile.mockReturnValueOnce(
      new Promise<File>((resolve) => {
        finishFirst = resolve;
      }),
    );

    const secondContainer = document.createElement("div");
    const secondRoot = createRoot(secondContainer);

    await render({ showShareButton: true });
    await act(async () => {
      secondRoot.render(
        createElement(AchievementCard, {
          achievement: { ...achievement, id: "second", title: "Second" },
          isCollected: true,
          showShareButton: true,
        }),
      );
    });

    expect(createShareFile).toHaveBeenCalledOnce();

    await act(async () => {
      finishFirst(file);
    });

    expect(createShareFile).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondRoot.unmount();
    });
  });
});

describe("AchievementCard sharing", () => {
  it("opens the native share sheet synchronously within the tap", async () => {
    await render({ showShareButton: true });

    expect(shareButton().textContent?.trim()).toBe("Share");

    // Deliberately no await or act: iOS needs this during the tap itself.
    act(() => {
      shareButton().click();
      expect(share).toHaveBeenCalledExactlyOnceWith({
        files: [file],
        text: `Caption for ${achievement.title}`,
      });
    });

    await act(async () => {});

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it.each([
    ["cannot share files", () => canShare.mockReturnValue(false)],
    ["has no share API", () => vi.stubGlobal("navigator", { clipboard: { writeText } })],
    [
      "has share but no canShare",
      () => vi.stubGlobal("navigator", { share, clipboard: { writeText } }),
    ],
  ])(
    "saves the image and copies the caption when the browser %s",
    async (_label, arrange) => {
      arrange();

      await render({ showShareButton: true });

      expect(shareButton().textContent?.trim()).toBe("Download");

      await tapShare();

      expect(share).not.toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
      expect(writeText).toHaveBeenCalledWith(
        `Caption for ${achievement.title}`,
      );
      expect(toasts.success).toHaveBeenCalledWith(
        "Image saved and caption copied",
        expect.any(Object),
      );
    },
  );

  it("still saves the image when the clipboard is unavailable", async () => {
    canShare.mockReturnValue(false);
    writeText.mockRejectedValue(new Error("Denied"));

    await render({ showShareButton: true });
    await tapShare();

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(toasts.success).toHaveBeenCalledWith(
      "Image saved",
      expect.any(Object),
    );
  });

  it("treats a cancelled share as a normal dismissal", async () => {
    share.mockRejectedValue(new DOMException("Cancelled", "AbortError"));

    await render({ showShareButton: true });
    await tapShare();

    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
    expect(toasts.error).not.toHaveBeenCalled();
    expect(shareButton().disabled).toBe(false);
  });

  it("falls back to saving when the native share fails", async () => {
    share.mockRejectedValue(new DOMException("Blocked", "NotAllowedError"));

    await render({ showShareButton: true });
    await tapShare();

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(shareButton().disabled).toBe(false);
  });

  it("blocks a second share while one is in progress", async () => {
    share.mockReturnValue(new Promise(() => {}));

    await render({ showShareButton: true });
    await tapShare();

    expect(shareButton().disabled).toBe(true);
  });

  it("retries a failed image from the Share button", async () => {
    createShareFile.mockRejectedValueOnce(new Error("No canvas"));

    await render({ showShareButton: true });

    expect(toasts.error).not.toHaveBeenCalled();
    expect(shareButton().disabled).toBe(false);

    await tapShare();

    expect(createShareFile).toHaveBeenCalledTimes(2);
    expect(share).not.toHaveBeenCalled();
    expect(toasts.success).toHaveBeenCalledWith(
      "Your image is ready",
      expect.any(Object),
    );

    await tapShare();

    expect(share).toHaveBeenCalledOnce();
  });

  it("tells the user when a retry also fails", async () => {
    createShareFile.mockRejectedValue(new Error("No canvas"));

    await render({ showShareButton: true });
    await tapShare();

    expect(toasts.error).toHaveBeenCalledWith(
      "Couldn't prepare your image",
      expect.any(Object),
    );
    expect(shareButton().disabled).toBe(false);
  });
});
