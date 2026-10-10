// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: mocks.info,
    error: mocks.error,
  },
}));

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: {
    style: { fontFamily: "TestFredoka" },
    className: "fredoka",
  },
  nunito: {
    style: { fontFamily: "TestNunito" },
    className: "nunito",
  },
}));

import { StreakShareButton } from "@/components/dashboard/streak-share-button";

let container: HTMLDivElement;
let root: Root;
let restorers: Array<() => void>;

class TestImage {
  static instances: TestImage[] = [];

  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";

  constructor() {
    TestImage.instances.push(this);
  }
}

const context = {
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({
    width: text.length * 12,
  })),
  drawImage: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
};

function replaceProperty(target: object, key: PropertyKey, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);

  Object.defineProperty(target, key, {
    configurable: true,
    value,
  });

  restorers.push(() => {
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    } else {
      Reflect.deleteProperty(target, key);
    }
  });
}

function button(label: string): HTMLButtonElement {
  const element = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find(
    (candidate) =>
      candidate.getAttribute("aria-label") === label ||
      candidate.textContent?.trim() === label,
  );

  if (!element) throw new Error(`Missing button: ${label}`);
  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

async function open(currentStreak = 5, username = "Alice") {
  await act(async () => {
    root.render(
      createElement(StreakShareButton, {
        username,
        currentStreak,
      }),
    );
  });

  await click("Share current streak");
}

async function completeImage() {
  const image = TestImage.instances.at(-1);
  if (!image) throw new Error("Flame image was not requested");

  await act(async () => {
    image.onload?.();
  });
}

async function ready(currentStreak = 5, username = "Alice") {
  await open(currentStreak, username);
  await completeImage();
}

function enableSharing(canShareFiles = true) {
  const share = vi.fn().mockResolvedValue(undefined);
  const canShare = vi.fn().mockReturnValue(canShareFiles);

  replaceProperty(window, "isSecureContext", true);
  replaceProperty(navigator, "share", share);
  replaceProperty(navigator, "canShare", canShare);

  return { share, canShare };
}

beforeEach(() => {
  vi.clearAllMocks();
  restorers = [];
  TestImage.instances = [];

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  replaceProperty(window, "Image", TestImage);
  replaceProperty(document, "fonts", {
    load: vi.fn().mockResolvedValue([]),
  });

  context.measureText.mockImplementation((text: string) => ({
    width: text.length * 12,
  }));

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,badge",
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => {
      callback(new Blob(["badge"], { type: "image/png" }));
    },
  );

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

  for (const restore of restorers.reverse()) {
    restore();
  }

  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("StreakShareButton", () => {
  it("waits for the badge image before enabling its actions", async () => {
    await open();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "Preparing your completely unnecessary achievement",
    );
    expect(button("Share achievement").disabled).toBe(true);
    expect(button("Download image").disabled).toBe(true);
    expect(TestImage.instances[0].src).toBe("/icons/flame.webp");

    await completeImage();

    const canvas = document.querySelector("canvas");
    expect(canvas?.hidden).toBe(false);
    expect(canvas?.width).toBe(1080);
    expect(canvas?.height).toBe(660);
    expect(button("Share achievement").disabled).toBe(false);
    expect(button("Download image").disabled).toBe(false);

    expect(context.fillText).toHaveBeenCalledWith(
      "5 Day Useless Streak",
      60,
      215,
    );
    expect(context.fillText).toHaveBeenCalledWith("Alice", 60, 425);
    expect(context.drawImage).toHaveBeenCalledOnce();
  });

  it("uses the single-day description", async () => {
    await ready(1);

    const drawnText = context.fillText.mock.calls
      .map(([text]) => text)
      .join(" ");

    expect(drawnText).toContain(
      "Returned for another completely unnecessary accomplishment.",
    );
  });

  it("provides the zero-streak caption", async () => {
    await ready(0);

    expect(document.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
      "My uselessness streak is currently 0.\n" +
        "Every pointless journey starts somewhere.",
    );
  });

  it("selects the caption when focused", async () => {
    await ready();

    const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
    if (!textarea) throw new Error("Missing caption");

    const select = vi.spyOn(textarea, "select");

    await act(async () => {
      textarea.blur();
      textarea.focus();
    });

    expect(select).toHaveBeenCalledOnce();
  });

  it("fits long text within the badge", async () => {
    context.measureText.mockImplementation((text: string) => ({
      width: text.length * 100,
    }));

    await ready(123456789, "A very long achievement collector username");

    expect(button("Share achievement").disabled).toBe(false);
    expect(context.fillText).toHaveBeenCalledWith(
      "123456789 Day Useless Streak",
      60,
      215,
    );
    expect(context.fillText).toHaveBeenCalledWith(
      "A very long achievement collector username",
      60,
      425,
    );
  });

  it("shows a preparation error when canvas rendering is unavailable", async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    await open();

    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "Couldn't prepare your streak achievement",
    );
    expect(button("Share achievement").disabled).toBe(true);
    expect(button("Download image").disabled).toBe(true);
  });

  it("shows a preparation error when the flame image fails", async () => {
    await open();

    await act(async () => {
      TestImage.instances[0].onerror?.();
    });

    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "Couldn't prepare your streak achievement",
    );
    expect(button("Download image").disabled).toBe(true);
  });

  it("downloads the generated PNG with the streak in its filename", async () => {
    await ready(7);

    let downloadedName: string | undefined;
    let downloadedUrl: string | undefined;

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadedName = this.download;
      downloadedUrl = this.href;
    });

    await click("Download image");

    expect(downloadedName).toBe("useless-achievements-streak-7.png");
    expect(downloadedUrl).toBe("data:image/png;base64,badge");
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith(
      "image/png",
    );
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("reports download failures", async () => {
    await ready();

    vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockImplementation(() => {
      throw new Error("Canvas export failed");
    });

    await click("Download image");

    expect(mocks.error).toHaveBeenCalledWith(
      "Couldn't download your badge. Please try again.",
    );
  });

  it("explains why sharing is unavailable on an insecure connection", async () => {
    const { share } = enableSharing();
    replaceProperty(window, "isSecureContext", false);
    await ready();

    await click("Share achievement");

    expect(mocks.info).toHaveBeenCalledWith(
      "Sharing requires a secure connection",
      {
        description: "Open the site using HTTPS to share your streak.",
      },
    );
    expect(share).not.toHaveBeenCalled();
    expect(button("Share achievement").disabled).toBe(false);
  });

  it("offers downloading when native sharing is unavailable", async () => {
    enableSharing();
    replaceProperty(navigator, "share", undefined);
    await ready();

    await click("Share achievement");

    expect(mocks.info).toHaveBeenCalledWith("Native sharing isn't available", {
      description: "Download the badge and share it manually.",
    });
    expect(button("Share achievement").disabled).toBe(false);
  });

  it("shares the generated PNG when file sharing is supported", async () => {
    const { share, canShare } = enableSharing();
    await ready();

    await click("Share achievement");

    expect(canShare).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledOnce();

    const payload = share.mock.calls[0][0];
    expect(payload.title).toBe("5 Day Useless Streak");
    expect(payload.text).toContain("5-day streak");
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0]).toBeInstanceOf(File);
    expect(payload.files[0].name).toBe("useless-achievements-streak-5.png");
    expect(payload.files[0].type).toBe("image/png");
  });

  it.each([false, undefined])(
    "shares text when file-sharing support is %s",
    async (support) => {
      const { share } = enableSharing(false);

      if (support === undefined) {
        replaceProperty(navigator, "canShare", undefined);
      }

      await ready();
      await click("Share achievement");

      expect(share).toHaveBeenCalledExactlyOnceWith({
        title: "5 Day Useless Streak",
        text: "I've  maintained a 5-day streak of accomplishing absolutely nothing.",
      });
    },
  );

  it("reports failure to generate the shareable file", async () => {
    const { share } = enableSharing();
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(
      (callback) => callback(null),
    );

    await ready();
    await click("Share achievement");

    expect(mocks.error).toHaveBeenCalledWith(
      "Couldn't prepare your badge for sharing.",
    );
    expect(share).not.toHaveBeenCalled();
    expect(button("Share achievement").disabled).toBe(false);
  });

  it("silently handles cancellation of native sharing", async () => {
    const { share } = enableSharing();
    share.mockRejectedValue(new DOMException("Cancelled", "AbortError"));

    await ready();
    await click("Share achievement");

    expect(mocks.error).not.toHaveBeenCalled();
    expect(button("Share achievement").disabled).toBe(false);
  });

  it("reports other sharing failures and restores the buttons", async () => {
    const { share } = enableSharing();
    share.mockRejectedValue(new Error("Sharing failed"));

    await ready();
    await click("Share achievement");

    expect(mocks.error).toHaveBeenCalledWith("Couldn't share your badge", {
      description: "Try downloading it instead.",
    });
    expect(button("Share achievement").disabled).toBe(false);
    expect(button("Download image").disabled).toBe(false);
  });

  it("disables both actions while native sharing is pending", async () => {
    const { share } = enableSharing();
    let finish!: () => void;

    share.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );

    await ready();
    await click("Share achievement");

    expect(button("Sharing…").disabled).toBe(true);
    expect(button("Download image").disabled).toBe(true);

    await act(async () => {
      finish();
    });

    expect(button("Share achievement").disabled).toBe(false);
    expect(button("Download image").disabled).toBe(false);
  });
});
