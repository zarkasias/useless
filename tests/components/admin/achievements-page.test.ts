// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAchievement } from "@/lib/services/admin-achievement-service-server";

const mocks = vi.hoisted(() => ({
  getAchievements: vi.fn(),
}));

vi.mock("@/lib/services/admin-achievement-service-server", () => ({
  getAdminAchievements: mocks.getAchievements,
}));

import AdminAchievementsPage from "@/app/admin/achievements/page";

type Params = Awaited<
  Parameters<typeof AdminAchievementsPage>[0]["searchParams"]
>;

function achievement(
  overrides: Partial<AdminAchievement> = {},
): AdminAchievement {
  return {
    id: "achievement-1",
    title: "Tab Collector",
    description: "Browse enthusiastically.",
    type: "RARE",
    emoji: null,
    icon_path: null,
    status: "draft",
    generated_by: "ai",
    category: null,
    trigger_type: null,
    trigger_config: null,
    icon_concept: null,
    image_prompt: null,
    pack_id: null,
    is_daily: false,
    created_at: "2026-10-08T12:00:00.000Z",
    achievement_packs: null,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.getAchievements.mockReset();
  mocks.getAchievements.mockResolvedValue([]);
});

async function render(params: Params = {}): Promise<HTMLDivElement> {
  const element = await AdminAchievementsPage({
    searchParams: Promise.resolve(params),
  });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

function titles(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('[data-slot="card-title"]'),
    (element) => element.textContent ?? "",
  );
}

describe("AdminAchievementsPage", () => {
  it("renders the empty state with All selected by default", async () => {
    const container = await render();

    expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith(
      undefined,
      false,
    );
    expect(container.textContent).toContain("No achievements found.");

    const activeLinks = Array.from(container.querySelectorAll("a")).filter(
      (link) => link.classList.contains("bg-gray-700"),
    );
    expect(activeLinks.map((link) => link.textContent)).toEqual(["All"]);
  });

  it.each(["draft", "review", "published", "archived"])(
    "forwards the valid status %s and preserves it in the search form",
    async (status) => {
      const container = await render({ status });

      expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith(
        status,
        false,
      );
      expect(
        container.querySelector<HTMLInputElement>('form input[name="status"]')
          ?.value,
      ).toBe(status);
    },
  );

  it.each(["all", "invalid", "PUBLISHED"])(
    "ignores the unfiltered or invalid status %s",
    async (status) => {
      const container = await render({ status });

      expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith(
        undefined,
        false,
      );
      expect(container.querySelector('form input[name="status"]')).toBeNull();
    },
  );

  it.each([
    { value: "true", expected: true },
    { value: "false", expected: false },
    { value: "TRUE", expected: false },
  ])("interprets missingIcon=$value", async ({ value, expected }) => {
    await render({ missingIcon: value });

    expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith(
      undefined,
      expected,
    );
  });

  it.each([
    { field: "title", value: "Needle Collector" },
    { field: "description", value: "Find a NEEDLE in a haystack." },
    { field: "category", value: "Needlework" },
    { field: "trigger_type", value: "needle_trigger" },
  ] as const)("matches search against $field", async ({ field, value }) => {
    mocks.getAchievements.mockResolvedValue([
      achievement({ [field]: value }),
      achievement({ id: "unrelated", title: "Unrelated" }),
    ]);

    const container = await render({ q: "  NEEDLE  " });

    expect(titles(container)).toHaveLength(1);
    expect(
      container.querySelector('a[href="/admin/achievements/achievement-1"]'),
    ).not.toBeNull();
  });

  it("shows the empty state when no achievement matches", async () => {
    mocks.getAchievements.mockResolvedValue([achievement()]);

    const container = await render({ q: "no-match" });

    expect(titles(container)).toEqual([]);
    expect(container.textContent).toContain("No achievements found.");
  });

  it("sorts achievements alphabetically and treats whitespace search as empty", async () => {
    mocks.getAchievements.mockResolvedValue([
      achievement({ id: "z", title: "Zebra" }),
      achievement({ id: "a", title: "Alpha" }),
    ]);

    expect(titles(await render({ q: "   " }))).toEqual(["Alpha", "Zebra"]);
  });

  it("preserves search text in status links", async () => {
    const container = await render({ q: "tabs & trophies" });
    const draftLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent === "Draft",
    );
    const url = new URL(
      draftLink!.getAttribute("href")!,
      "https://example.com",
    );

    expect(url.searchParams.get("status")).toBe("draft");
    expect(url.searchParams.get("q")).toBe("tabs & trophies");
    expect(
      container.querySelector<HTMLInputElement>('input[name="q"]')?.value,
    ).toBe("tabs & trophies");
  });

  it("renders fallback labels and the missing-icon state", async () => {
    mocks.getAchievements.mockResolvedValue([achievement()]);

    const container = await render();

    for (const text of [
      "🏆",
      "Uncategorized",
      "Unassigned",
      "Legacy",
      "Icon needed",
    ]) {
      expect(container.textContent).toContain(text);
    }
  });

  it.each(["object", "array"])(
    "renders a pack supplied as an %s and the assigned-icon state",
    async (shape) => {
      const pack = { id: "pack-1", name: "Internet Habits", slug: "habits" };
      mocks.getAchievements.mockResolvedValue([
        achievement({
          emoji: "⭐",
          category: "Browsing",
          trigger_type: "daily_claim",
          icon_path: "/icons/test.webp",
          achievement_packs: shape === "array" ? [pack] : pack,
        }),
      ]);

      const container = await render();

      for (const text of [
        "⭐",
        "Browsing",
        "daily_claim",
        "Internet Habits",
        "Icon assigned",
      ]) {
        expect(container.textContent).toContain(text);
      }
      expect(container.textContent).not.toContain("Icon needed");
    },
  );

  it("propagates service failures", async () => {
    const error = new Error("Achievement service unavailable");
    mocks.getAchievements.mockRejectedValue(error);

    await expect(
      AdminAchievementsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toBe(error);
  });
});
