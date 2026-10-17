// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementPack } from "@/lib/types/achievement-pack";

const mocks = vi.hoisted(() => ({
  getPacks: vi.fn(),
}));

vi.mock("@/lib/services/achievement-pack-service-server", () => ({
  getAchievementPacks: mocks.getPacks,
}));

import AchievementPacksPage from "@/app/admin/achievement-packs/page";

function makePack(overrides: Partial<AchievementPack> = {}): AchievementPack {
  return {
    id: "pack-1",
    name: "Internet Habits",
    slug: "internet-habits",
    description: "Small accomplishments for everyday browsing.",
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

beforeEach(() => {
  mocks.getPacks.mockReset();
  mocks.getPacks.mockResolvedValue([]);
});

async function render(): Promise<HTMLDivElement> {
  const element = await AchievementPacksPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("AchievementPacksPage", () => {
  it("renders the heading and create-pack link", async () => {
    const container = await render();

    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(container.querySelector("h1")?.textContent).toBe(
      "Achievement Packs",
    );

    const createLink = container.querySelector(
      'a[href="/admin/achievement-packs/new"]',
    );
    expect(createLink?.textContent).toBe("Create Pack");
  });

  it("shows guidance when there are no packs", async () => {
    const container = await render();

    expect(container.textContent).toContain("No achievement packs yet.");
    expect(container.textContent).toContain(
      "Create your first pack to get started.",
    );
    expect(container.querySelectorAll('[data-slot="card-title"]')).toHaveLength(
      0,
    );
  });

  it("renders each pack's details and corresponding edit link", async () => {
    const packs = [
      makePack(),
      makePack({
        id: "pack-2",
        name: "Winter Wins",
        slug: "winter-wins",
        pack_type: "seasonal",
        status: "scheduled",
        description: "A seasonal collection.",
      }),
    ];
    mocks.getPacks.mockResolvedValue(packs);

    const container = await render();
    const cards = Array.from(container.querySelectorAll('[data-slot="card"]'));

    expect(cards).toHaveLength(2);
    expect(container.textContent).not.toContain("No achievement packs yet.");

    packs.forEach((pack, index) => {
      const card = cards[index];

      expect(card.querySelector('[data-slot="card-title"]')?.textContent).toBe(
        pack.name,
      );
      expect(card.textContent).toContain(`Type: ${pack.pack_type}`);
      expect(card.textContent).toContain(`Status: ${pack.status}`);
      expect(card.textContent).toContain(`Slug: ${pack.slug}`);
      expect(card.textContent).toContain(pack.description);

      const editLink = card.querySelector("a");
      expect(editLink?.textContent).toBe("Edit Pack");
      expect(editLink?.getAttribute("href")).toBe(
        `/admin/achievement-packs/${pack.id}`,
      );
    });
  });

  it.each([null, ""])(
    "omits the description paragraph when the description is %s",
    async (description) => {
      mocks.getPacks.mockResolvedValue([makePack({ description })]);

      const container = await render();
      const content = container.querySelector('[data-slot="card-content"]');

      expect(content?.querySelectorAll("p")).toHaveLength(3);
      expect(content?.textContent).toContain("Type: core");
      expect(content?.textContent).toContain("Status: active");
      expect(content?.textContent).toContain("Slug: internet-habits");
    },
  );

  it("propagates a failed pack request", async () => {
    const error = new Error("Pack service unavailable");
    mocks.getPacks.mockRejectedValue(error);

    await expect(AchievementPacksPage()).rejects.toBe(error);
  });
});
