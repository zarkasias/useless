// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  claim: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  share: vi.fn(),
  shareOptions: vi.fn(),
  feed: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/app/actions/achievement-actions", () => ({
  claimDailyAchievementAction: mocks.claim,
}));

vi.mock("sonner", () => ({
  toast: { info: mocks.info, error: mocks.error, success: vi.fn() },
}));

vi.mock("@/components/navbar", () => ({ Navbar: () => null }));

vi.mock("@/components/packs/featured-pack-promo", () => ({
  FeaturedPackPromo: () => null,
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement("div", { "data-testid": "ladder-card" }, achievement.title),
}));

vi.mock("@/components/home-preview/card-feed", () => ({
  CardFeed: (props: {
    label: string;
    revealed: Achievement | null;
    restored: boolean;
    ready: boolean;
  }) => {
    mocks.feed(props);
    return createElement("div", { "data-testid": "feed" }, props.label);
  },
}));

vi.mock("@/components/use-achievement-share", () => ({
  useAchievementShare: (options: { enabled: boolean }) => {
    mocks.shareOptions(options);
    return {
      share: mocks.share,
      canShareFiles: true,
      isBusy: false,
      canTapShare: options.enabled,
    };
  },
}));

vi.mock("@/lib/share-image", () => ({
  renderShareImage: vi.fn(async () => new Blob(["png"])),
  renderCardBack: vi.fn(async () => new Blob(["png"])),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import HomePreviewClient from "@/app/home-preview/home-preview-client";
import { CLAIM_STORAGE_KEY } from "@/components/home-preview/use-daily-claim";

function achievement(
  id: string,
  type: Achievement["type"],
  title = `Title ${id}`,
): Achievement {
  return {
    id,
    title,
    description: "Did nothing.",
    type,
    emoji: "🏆",
    icon_path: `/icons/${id}.webp`,
    created_at: "2026-01-01",
    is_secret: false,
    trigger_type: null,
    trigger_config: null,
    status: "published",
  };
}

const featured = [
  achievement("hero", "RARE", "Still Here Somehow"),
  achievement("rare", "RARE"),
  achievement("epic", "EPIC"),
  achievement("legendary", "LEGENDARY"),
  achievement("game", "GAME"),
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: false,
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:face");
  vi.spyOn(console, "error").mockImplementation(() => {});

  window.localStorage.clear();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function render(loggedIn = false) {
  await act(async () => {
    root.render(
      createElement(HomePreviewClient, {
        initialProfile: loggedIn
          ? ({ id: "u", username: "me" } as never)
          : null,
        initialEntitlements: null,
        initialPacks: [],
        featuredAchievements: featured,
      }),
    );
  });
}

function buttons(text: string) {
  return Array.from(container.querySelectorAll("button")).filter((button) =>
    button.textContent?.includes(text),
  );
}

async function click(element: HTMLElement | undefined) {
  if (!element) throw new Error("Missing element");
  await act(async () => element.click());
}

describe("HomePreviewClient", () => {
  it("shows one claim button up top and one at the end, and says no account is needed", async () => {
    await render();

    expect(buttons("Claim my useless achievement")).toHaveLength(2);
    expect(container.textContent).toContain("No account needed");
    expect(container.textContent).not.toContain("Sign up to share");
  });

  it("reveals the claimed achievement in place and offers to share it", async () => {
    const won = achievement("won", "EPIC", "Professional Napper");
    mocks.claim.mockResolvedValue({ status: "claimed", achievement: won });

    await render();
    await click(buttons("Claim my useless achievement")[0]);

    expect(mocks.claim).toHaveBeenCalledExactlyOnceWith(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.shareOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: true,
        input: expect.objectContaining({ title: "Professional Napper" }),
      }),
    );
    expect(mocks.feed).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: "Your achievement: Professional Napper",
        revealed: won,
        restored: false,
      }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(CLAIM_STORAGE_KEY)!),
    ).toMatchObject({ achievement: { id: "won" } });
    expect(container.textContent).toContain("You unlocked Professional Napper");
    expect(container.textContent).toContain("Create a free account to keep it");

    await click(buttons("Share it")[0]);
    expect(mocks.share).toHaveBeenCalledOnce();
    expect(buttons("Claim my useless achievement")).toHaveLength(0);
  });

  it("links signed-in visitors to their collection after claiming", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("won", "EPIC"),
    });

    await render(true);
    await click(buttons("Claim my useless achievement")[0]);

    expect(container.textContent).toContain("See my collection");
    expect(container.textContent).not.toContain("Create a free account");
  });

  it("tells visitors when they have already claimed today", async () => {
    mocks.claim.mockResolvedValue({ status: "already_claimed" });

    await render();
    await click(buttons("Claim my useless achievement")[1]);

    expect(mocks.info).toHaveBeenCalledExactlyOnceWith(
      "You've already claimed today's achievement.",
    );
    expect(buttons("Share it")).toHaveLength(0);
  });

  it("sends visitors to Pro when a subscription is required", async () => {
    mocks.claim.mockResolvedValue({ status: "subscription_required" });

    await render();
    await click(buttons("Claim my useless achievement")[0]);

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/pro");
  });

  it("shows an error when the claim fails", async () => {
    mocks.claim.mockRejectedValue(new Error("network"));

    await render();
    await click(buttons("Claim my useless achievement")[0]);

    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
      "Something went wrong.",
    );
    expect(buttons("Claim my useless achievement")[0].disabled).toBe(false);
  });

  it("shows today's saved achievement on a return visit without claiming again", async () => {
    const saved = achievement("saved", "RARE", "Two Weeks Wasted");
    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    window.localStorage.setItem(
      CLAIM_STORAGE_KEY,
      JSON.stringify({ day, achievement: saved }),
    );

    await render();

    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.feed).toHaveBeenLastCalledWith(
      expect.objectContaining({ revealed: saved, restored: true, ready: true }),
    );
    expect(container.textContent).toContain("You unlocked Two Weeks Wasted");
    expect(buttons("Share it")).toHaveLength(1);
  });

  it("ignores a saved achievement from an earlier day and plays the loop", async () => {
    window.localStorage.setItem(
      CLAIM_STORAGE_KEY,
      JSON.stringify({
        day: "2020-01-01",
        achievement: achievement("old", "RARE"),
      }),
    );

    await render();

    expect(mocks.feed).toHaveBeenLastCalledWith(
      expect.objectContaining({ revealed: null, ready: true }),
    );
    expect(buttons("Claim my useless achievement")).toHaveLength(2);
  });

  it("still works when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("won", "EPIC", "Professional Napper"),
    });

    await render();
    await click(buttons("Claim my useless achievement")[0]);

    expect(container.textContent).toContain("You unlocked Professional Napper");
  });

  it("shows one card per rarity, without repeating the hero card", async () => {
    await render();

    const ladder = Array.from(
      container.querySelectorAll("[data-testid=ladder-card]"),
    ).map((card) => card.textContent);

    expect(ladder).toEqual([
      "Title rare",
      "Title epic",
      "Title legendary",
      "Title game",
    ]);
  });
});
