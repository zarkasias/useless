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
  scene: vi.fn(),
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

// The 3D scene is loaded with next/dynamic; stand in for it with a stub
// that records what the hero asks it to show.
interface SceneProps {
  claim: {
    status: string;
    achievement: { title: string } | null;
    restored?: boolean;
  };
  onSettled?: () => void;
}

// Only shown under reduced motion or if the scene fails; it draws on
// canvases with the brand fonts, which tests can't load.
vi.mock("@/components/hero/hero-static-card", () => ({
  HeroStaticCard: () => null,
}));

vi.mock("next/dynamic", () => ({
  default: () => (props: SceneProps) => {
    mocks.scene(props);
    return null;
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

import HomePageClient from "@/app/home/home-page-client";
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
  // jsdom has no scrolling.
  Element.prototype.scrollIntoView = vi.fn();
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

async function render(
  loggedIn = false,
  visitor: Partial<{
    achievement: Achievement | null;
    linked: boolean;
    mustSignIn: boolean;
  }> = {},
) {
  await act(async () => {
    root.render(
      createElement(HomePageClient, {
        initialProfile: loggedIn
          ? ({ id: "u", username: "me" } as never)
          : null,
        initialEntitlements: null,
        initialPacks: [],
        featuredAchievements: featured,
        visitor: {
          signedIn: loggedIn,
          linked: false,
          achievement: null,
          mustSignIn: false,
          ...visitor,
        },
      }),
    );
  });
}

/** What the hero last asked the scene to show. */
function lastScene(): SceneProps {
  const calls = mocks.scene.mock.calls;

  if (calls.length === 0) throw new Error("The scene never rendered");

  return calls[calls.length - 1]![0] as SceneProps;
}

/** The deck lands, as the scene reports once the stack has settled. */
async function settle() {
  await act(async () => lastScene().onSettled?.());
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

describe("HomePageClient", () => {
  it("shows one claim button up top and one at the end, and says no account is needed", async () => {
    await render();

    expect(buttons("Claim my useless achievement")).toHaveLength(2);
    expect(container.textContent).toContain("No account needed");
    expect(container.textContent).not.toContain("Sign up to share");
  });

  it("keeps Share out of sight until something is claimed", async () => {
    await render();

    // The page styles disabled buttons at 0.65 opacity, so opacity alone
    // isn't enough to hide it.
    const [share] = buttons("Share it");

    expect(share!.classList.contains("invisible")).toBe(true);
    expect(share!.ariaHidden).toBe("true");
    expect(share!.tabIndex).toBe(-1);
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
    // The share image waits until the deck has landed.
    expect(mocks.shareOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: false,
        input: expect.objectContaining({ title: "Professional Napper" }),
      }),
    );
    expect(lastScene().claim).toMatchObject({
      status: "revealed",
      achievement: { title: "Professional Napper" },
      restored: false,
    });
    expect(
      JSON.parse(window.localStorage.getItem(CLAIM_STORAGE_KEY)!),
    ).toMatchObject({ achievement: { id: "won" } });
    expect(container.textContent).toContain("You unlocked Professional Napper");
    expect(container.textContent).toContain("Create a free account to keep it");

    // Share is prepared and usable once the deck has landed.
    await settle();
    expect(mocks.shareOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true }),
    );
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

    expect(container.textContent).toContain("See it in your collection");
    expect(container.textContent).not.toContain("Create a free account");
  });

  it("tells visitors when they have already claimed today", async () => {
    mocks.claim.mockResolvedValue({ status: "already_claimed" });

    await render();
    await click(buttons("Claim my useless achievement")[1]);

    expect(mocks.info).toHaveBeenCalledExactlyOnceWith(
      "You've already claimed today's achievement.",
    );
    // Share stays hidden and out of reach until a card is revealed.
    expect(buttons("Share it").every((b) => b.ariaHidden === "true")).toBe(
      true,
    );
    expect(lastScene().claim).toMatchObject({ status: "failed" });
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
    expect(lastScene().claim).toMatchObject({
      status: "revealed",
      achievement: { title: "Two Weeks Wasted" },
      restored: true,
    });
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

    expect(lastScene().claim).toMatchObject({
      status: "idle",
      achievement: null,
    });
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

  it("opens on a claim made elsewhere today, as the server reports it", async () => {
    await render(true, {
      achievement: achievement("dash", "RARE", "Claimed On The Dashboard"),
    });

    expect(mocks.claim).not.toHaveBeenCalled();
    expect(lastScene().claim).toMatchObject({
      status: "revealed",
      achievement: { title: "Claimed On The Dashboard" },
      restored: true,
    });
    expect(buttons("Claim my useless achievement")).toHaveLength(0);
  });

  it("asks a browser linked to an account to sign in instead of claiming", async () => {
    await render(false, { linked: true, mustSignIn: true });

    expect(buttons("Claim my useless achievement")).toHaveLength(0);

    const signIn = Array.from(container.querySelectorAll("a")).filter((link) =>
      link.textContent?.includes("Sign in to claim"),
    );

    expect(signIn).toHaveLength(2);
    expect(signIn[0]!.getAttribute("href")).toBe("/login?next=%2F");
  });

  it("reveals in the hero when claiming from the bottom of the page", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: achievement("won", "EPIC", "Professional Napper"),
    });
    const scroll = vi.fn();

    await render();
    container.querySelector("#top")!.scrollIntoView = scroll;
    await click(buttons("Claim my useless achievement")[1]);

    expect(scroll).toHaveBeenCalledOnce();
    expect(lastScene().claim).toMatchObject({ status: "revealed" });
  });
});
