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

// next/font only works inside a Next build.
vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "fredoka" },
  nunito: { className: "nunito" },
}));

vi.mock("@/lib/share-image", () => ({
  renderShareImage: vi.fn(async () => new Blob(["png"])),
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

const catalog = [
  achievement("common", "COMMON", "Just Checking"),
  achievement("rare", "RARE", "Mouse Mileage"),
  achievement("epic", "EPIC", "App Whisperer"),
  achievement("legendary", "LEGENDARY", "Unintentional Beta Tester"),
  achievement("rare-2", "RARE", "Midnight Oil"),
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
  {
    unlockedIds = [],
    ...visitor
  }: Partial<{
    achievement: Achievement | null;
    linked: boolean;
    mustSignIn: boolean;
    unlockedIds: string[];
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
        featuredAchievements: catalog,
        catalog,
        unlockedIds,
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

function buttons(text: string) {
  return Array.from(container.querySelectorAll("button")).filter((button) =>
    button.textContent?.includes(text),
  );
}

/** Every wall card for one achievement id. */
function wallCards(id: string) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(`[data-wall-card="${id}"]`),
  );
}

async function click(element: HTMLElement | undefined) {
  if (!element) throw new Error("Missing element");
  await act(async () => element.click());
}

function today() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

describe("HomePageClient layout", () => {
  it("has a centred text hero with no hero card, and two Claim buttons", async () => {
    await render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "Accomplish absolutely nothing useful.",
    );
    expect(container.querySelector("canvas")).toBeNull();
    expect(buttons("Claim my useless achievement")).toHaveLength(2);
    expect(container.textContent).toContain(
      "One new achievement a day. Your first 10 are free; Pro keeps them coming.",
    );
  });

  it("tells only logged-out visitors in the hero that no account is needed", async () => {
    await render();
    expect(container.querySelector("#top")?.textContent).toContain(
      "No account needed.",
    );

    await render(true);
    expect(container.querySelector("#top")?.textContent).not.toContain(
      "No account needed.",
    );
  });

  it("shows one example card per rarity, Common to Legendary", async () => {
    await render();

    const tiers = container.querySelector(
      '[aria-label="Example achievements by rarity"]',
    );

    expect(
      Array.from(tiers?.querySelectorAll("li") ?? []).map((li) =>
        li.textContent?.includes("Did nothing.") ? li.textContent : "",
      ),
    ).toEqual([
      expect.stringContaining("Just Checking"),
      expect.stringContaining("Mouse Mileage"),
      expect.stringContaining("App Whisperer"),
      expect.stringContaining("Unintentional Beta Tester"),
    ]);
  });
});

describe("HomePageClient wall", () => {
  it("draws every catalog entry on the wall, out of the tab order", async () => {
    await render();

    for (const entry of catalog) {
      const cards = wallCards(entry.id);

      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((card) => card.tabIndex === -1)).toBe(true);
      expect(cards[0]!.getAttribute("aria-label")).toBe(
        `Open ${entry.title}`,
      );
    }
  });

  it("shows logged-out visitors the whole wall in colour", async () => {
    await render();

    expect(container.querySelector('[aria-label$="(locked)"]')).toBeNull();
  });

  it("shows signed-in users their locked cards", async () => {
    await render(true, { unlockedIds: ["rare"] });

    expect(wallCards("rare")[0]!.getAttribute("aria-label")).toBe(
      "Open Mouse Mileage",
    );
    expect(wallCards("epic")[0]!.getAttribute("aria-label")).toBe(
      "Open App Whisperer (locked)",
    );
  });

  it("unlocks a claimed card on the wall straight away", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: catalog[2],
    });

    await render(true);
    expect(wallCards("epic")[0]!.getAttribute("aria-label")).toContain(
      "(locked)",
    );

    await click(buttons("Claim my useless achievement")[0]);

    expect(wallCards("epic")[0]!.getAttribute("aria-label")).toBe(
      "Open App Whisperer",
    );
  });
});

describe("HomePageClient zoom", () => {
  it("zooms a wall card, locked for a logged-out visitor who hasn't claimed it", async () => {
    await render();
    await click(wallCards("epic")[0]);

    const dialog = container.querySelector("[role=dialog]");

    expect(dialog?.textContent).toContain("App Whisperer");
    expect(container.textContent).toContain("Locked. Unlock it to share it.");
  });

  it("zooms a signed-in user's unlocked card without the locked note", async () => {
    await render(true, { unlockedIds: ["epic"] });
    await click(wallCards("epic")[0]);

    expect(container.querySelector("[role=dialog]")).not.toBeNull();
    expect(container.textContent).not.toContain("Locked. Unlock it");
  });
});

describe("HomePageClient claim", () => {
  it("claims through the existing flow and remembers it for the day", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: catalog[1],
    });

    await render();
    await click(buttons("Claim my useless achievement")[0]);

    expect(mocks.claim).toHaveBeenCalledExactlyOnceWith(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    expect(mocks.refresh).toHaveBeenCalled();
    expect(
      JSON.parse(window.localStorage.getItem(CLAIM_STORAGE_KEY)!),
    ).toMatchObject({ achievement: { id: "rare" } });
    expect(buttons("Open today's achievement")).toHaveLength(1);
    expect(container.textContent).toContain("Back to my achievement");
  });

  it("never claims twice in a day", async () => {
    window.localStorage.setItem(
      CLAIM_STORAGE_KEY,
      JSON.stringify({ day: today(), achievement: catalog[0] }),
    );

    await render();
    await click(buttons("Open today's achievement")[0]);

    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it("opens on a claim made elsewhere today, as the server reports it", async () => {
    await render(true, { achievement: catalog[3] });

    expect(buttons("Open today's achievement")).toHaveLength(1);
    expect(buttons("Claim my useless achievement")).toHaveLength(0);
    expect(wallCards("legendary")[0]!.getAttribute("aria-label")).toBe(
      "Open Unintentional Beta Tester",
    );
  });

  it("tells visitors when they have already claimed today", async () => {
    mocks.claim.mockResolvedValue({ status: "already_claimed" });

    await render();
    await click(buttons("Claim my useless achievement")[1]);

    expect(mocks.info).toHaveBeenCalledExactlyOnceWith(
      "You've already claimed today's achievement.",
    );
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
    expect(buttons("Claim my useless achievement")[0]!.disabled).toBe(false);
  });

  it("asks a browser linked to an account to sign in instead of claiming", async () => {
    await render(false, { linked: true, mustSignIn: true });

    expect(buttons("Claim my useless achievement")).toHaveLength(0);
    expect(
      Array.from(container.querySelectorAll("a")).filter((link) =>
        link.textContent?.includes("Sign in to claim"),
      ),
    ).toHaveLength(2);
  });

  it("scrolls back up when claiming from the bottom of the page", async () => {
    mocks.claim.mockResolvedValue({
      status: "claimed",
      achievement: catalog[0],
    });

    await render();
    await click(buttons("Claim my useless achievement")[1]);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(mocks.claim).toHaveBeenCalledOnce();
  });
});
