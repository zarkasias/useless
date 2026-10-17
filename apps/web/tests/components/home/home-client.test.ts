// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  claim: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  unlock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/app/actions/achievement-actions", () => ({
  claimDailyAchievementAction: mocks.claim,
}));

vi.mock("sonner", () => ({
  toast: {
    info: mocks.info,
    error: mocks.error,
    success: mocks.success,
  },
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

vi.mock("@/components/feature-card", () => ({
  FeatureCard: () => null,
}));

vi.mock("@/components/packs/featured-pack-promo", () => ({
  FeaturedPackPromo: () => null,
}));

vi.mock("@/components/unlock-achievement", () => ({
  UnlockAchievement: (props: {
    achievement: unknown;
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
  }) => {
    mocks.unlock(props);
    return props.isOpen
      ? createElement("button", { onClick: props.onClose }, "Close achievement")
      : null;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "font-fredoka" },
  nunito: { className: "font-nunito" },
  titan: { className: "font-titan" },
  baloo: { className: "font-baloo" },
}));

import HomeClient from "@/app/home/home-client";

let container: HTMLDivElement | undefined;
let root: Root | undefined;

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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

async function render() {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(HomeClient, {
        initialProfile: null,
        initialEntitlements: null,
        initialPacks: [],
      }),
    );
  });
}

function claimButtons(): HTMLButtonElement[] {
  return Array.from(container?.querySelectorAll("button") ?? []).filter(
    (button) => {
      const text = button.textContent?.trim() ?? "";

      return (
        text.startsWith("Claim my useless achievement") ||
        text.startsWith("Claiming…")
      );
    },
  );
}

async function claim() {
  const button = claimButtons()[0];
  if (!button) throw new Error("Missing claim button");

  await act(async () => {
    button.click();
  });
}

describe("HomeClient daily claims", () => {
  it("claims using the browser timezone and opens the unlocked achievement", async () => {
    const achievement = { id: "achievement-1", title: "A tiny win" };
    mocks.claim.mockResolvedValue({ status: "claimed", achievement });

    await render();
    await claim();

    expect(mocks.claim).toHaveBeenCalledExactlyOnceWith(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith(
      "Today's achievement unlocked!",
    );
    expect(mocks.unlock).toHaveBeenLastCalledWith({
      achievement,
      isOpen: true,
      onClose: expect.any(Function),
      isLoggedIn: false,
    });
    expect(claimButtons().every((button) => !button.disabled)).toBe(true);

    const close = Array.from(container?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent === "Close achievement",
    );
    if (!close) throw new Error("Missing modal close button");

    await act(async () => {
      close.click();
    });

    expect(mocks.unlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ isOpen: false }),
    );
  });

  it("shows an informational message when already claimed", async () => {
    mocks.claim.mockResolvedValue({ status: "already_claimed" });

    await render();
    await claim();

    expect(mocks.info).toHaveBeenCalledExactlyOnceWith(
      "You've already claimed today's achievement.",
    );
    expect(mocks.unlock).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(claimButtons().every((button) => !button.disabled)).toBe(true);
  });

  it("navigates to Pro when a subscription is required", async () => {
    mocks.claim.mockResolvedValue({ status: "subscription_required" });

    await render();
    await claim();

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/pro");
    expect(mocks.unlock).not.toHaveBeenCalled();
    expect(claimButtons().every((button) => !button.disabled)).toBe(true);
  });

  it("shows an error when today's achievement is unavailable", async () => {
    mocks.claim.mockResolvedValue({ status: "unavailable" });

    await render();
    await claim();

    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
      "Today's achievement is unavailable right now.",
    );
    expect(mocks.unlock).not.toHaveBeenCalled();
    expect(claimButtons().every((button) => !button.disabled)).toBe(true);
  });

  it("handles a failed claim and allows retrying", async () => {
    const error = new Error("Claim service unavailable");
    mocks.claim.mockRejectedValueOnce(error);

    await render();
    await claim();

    expect(console.error).toHaveBeenCalledWith(
      "Error claiming daily achievement:",
      error,
    );
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
      "Something went wrong.",
    );
    expect(claimButtons().every((button) => !button.disabled)).toBe(true);

    mocks.claim.mockResolvedValue({ status: "already_claimed" });
    await claim();

    expect(mocks.claim).toHaveBeenCalledTimes(2);
  });

  it("disables both claim buttons while a claim is pending", async () => {
    let finishClaim!: (value: { status: string }) => void;
    mocks.claim.mockReturnValue(
      new Promise<{ status: string }>((resolve) => {
        finishClaim = resolve;
      }),
    );

    await render();
    await claim();

    expect(claimButtons()).toHaveLength(2);
    for (const button of claimButtons()) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("aria-busy")).toBe("true");
    }

    await act(async () => {
      for (const button of claimButtons()) {
        button.click();
      }
    });

    expect(mocks.claim).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishClaim({ status: "already_claimed" });
    });

    expect(claimButtons().every((button) => !button.disabled)).toBe(true);
  });
});
