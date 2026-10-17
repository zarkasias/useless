// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementPack } from "@/lib/types/achievement-pack";

const mocks = vi.hoisted(() => ({
  getPack: vi.fn(),
  getAchievements: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/services/achievement-pack-service-server", () => ({
  getAchievementPackById: mocks.getPack,
  getAchievementsForPack: mocks.getAchievements,
}));

vi.mock("@/app/admin/achievement-packs/actions", () => ({
  updateAchievementPack: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

import EditAchievementPackPage from "@/app/admin/achievement-packs/[id]/page";

function makePack(overrides: Partial<AchievementPack> = {}): AchievementPack {
  return {
    id: "pack-1",
    name: "Internet Habits",
    slug: "internet-habits",
    description: null,
    pack_type: "core",
    starts_at: null,
    ends_at: null,
    status: "active",
    cover_image_path: null,
    created_at: "2026-10-08T12:00:00.000Z",
    updated_at: "2026-10-08T12:00:00.000Z",
    stripe_product_id: null,
    stripe_price_id: null,
    price_cents: null,
    theme_key: null,
    currency: null,
    ...overrides,
  };
}

function makeAchievement(id: string, type = "COMMON") {
  return {
    id,
    title: `Achievement ${id}`,
    description: `Description ${id}`,
    type,
    status: "draft",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPack.mockReset();
  mocks.getAchievements.mockReset();
  mocks.notFound.mockReset();

  mocks.getPack.mockResolvedValue(makePack());
  mocks.getAchievements.mockResolvedValue([]);
  mocks.notFound.mockImplementation(() => {
    throw new Error("TEST_NOT_FOUND");
  });
});

async function render(): Promise<HTMLDivElement> {
  const element = await EditAchievementPackPage({
    params: Promise.resolve({ id: "pack-1" }),
  });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

function value(container: HTMLElement, id: string): string | undefined {
  return container.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(`#${id}`)?.value;
}

describe("EditAchievementPackPage", () => {
  it("loads the pack and its achievements and populates the form", async () => {
    const container = await render();

    expect(mocks.getPack).toHaveBeenCalledExactlyOnceWith("pack-1");
    expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith("pack-1");
    expect(container.querySelector("h1")?.textContent).toBe(
      "Edit Achievement Pack",
    );
    expect(value(container, "name")).toBe("Internet Habits");
    expect(value(container, "slug")).toBe("internet-habits");
    expect(value(container, "pack_type")).toBe("core");
    expect(value(container, "status")).toBe("active");
    expect(
      container.querySelector<HTMLInputElement>('input[name="id"]')?.value,
    ).toBe("pack-1");
    expect(
      container.querySelector('a[href="/admin/achievement-packs"]'),
    ).not.toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Save Changes");
  });

  it("defaults missing optional values and displays an empty collection", async () => {
    const container = await render();

    for (const id of [
      "description",
      "cover_image_path",
      "starts_at",
      "ends_at",
    ]) {
      expect(value(container, id)).toBe("");
    }
    expect(value(container, "theme_key")).toBe("default");
    expect(container.textContent).toContain("0 achievements in this pack");
    expect(container.textContent).toContain(
      "No achievements in this pack yet.",
    );

    for (const rarity of ["Common", "Rare", "Epic", "Legendary"]) {
      expect(container.textContent).toContain(`${rarity}: 0`);
    }
  });

  it("populates optional description, icon, and theme values", async () => {
    mocks.getPack.mockResolvedValue(
      makePack({
        description: "Seasonal accomplishments",
        cover_image_path: "/icons/holiday.webp",
        theme_key: "holiday",
      }),
    );

    const container = await render();

    expect(value(container, "description")).toBe("Seasonal accomplishments");
    expect(value(container, "cover_image_path")).toBe("/icons/holiday.webp");
    expect(value(container, "theme_key")).toBe("holiday");
  });

  it("converts scheduled timestamps into local date-time input values", async () => {
    mocks.getPack.mockResolvedValue(
      makePack({
        starts_at: "2026-10-08T12:30:00.000Z",
        ends_at: "2026-12-08T18:45:00.000Z",
      }),
    );

    function localValue(timestamp: string): string {
      const date = new Date(timestamp);
      const pad = (number: number) => String(number).padStart(2, "0");
      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}`
      );
    }

    const container = await render();

    expect(value(container, "starts_at")).toBe(
      localValue("2026-10-08T12:30:00.000Z"),
    );
    expect(value(container, "ends_at")).toBe(
      localValue("2026-12-08T18:45:00.000Z"),
    );
  });

  it("renders one achievement with singular wording and its edit link", async () => {
    mocks.getAchievements.mockResolvedValue([makeAchievement("a1", "RARE")]);

    const container = await render();

    expect(container.textContent).toContain("1 achievement in this pack");
    expect(container.textContent).not.toContain("1 achievements in this pack");
    expect(container.textContent).toContain("Achievement a1");
    expect(container.textContent).toContain("Description a1");
    expect(container.textContent).toContain("Rare: 1");
    expect(container.textContent).not.toContain(
      "No achievements in this pack yet.",
    );
    expect(
      container.querySelector('a[href="/admin/achievements/a1"]')?.textContent,
    ).toBe("Edit");
  });

  it("counts repeated rarities and includes secret and game achievements in the total", async () => {
    mocks.getAchievements.mockResolvedValue([
      makeAchievement("1", "COMMON"),
      makeAchievement("2", "COMMON"),
      makeAchievement("3", "RARE"),
      makeAchievement("4", "EPIC"),
      makeAchievement("5", "LEGENDARY"),
      makeAchievement("6", "SECRET"),
      makeAchievement("7", "GAME"),
    ]);

    const container = await render();

    expect(container.textContent).toContain("7 achievements in this pack");
    expect(container.textContent).toContain("Common: 2");
    expect(container.textContent).toContain("Rare: 1");
    expect(container.textContent).toContain("Epic: 1");
    expect(container.textContent).toContain("Legendary: 1");
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(7);
  });

  it("returns not found for an unknown pack", async () => {
    mocks.getPack.mockResolvedValue(null);

    await expect(render()).rejects.toThrow("TEST_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
  });

  it.each(["pack", "achievements"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      if (service === "pack") {
        mocks.getPack.mockRejectedValue(error);
      } else {
        mocks.getAchievements.mockRejectedValue(error);
      }

      await expect(render()).rejects.toBe(error);
      expect(mocks.notFound).not.toHaveBeenCalled();
    },
  );
});
