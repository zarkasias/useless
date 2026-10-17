// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementPack } from "@/lib/types/achievement-pack";

const mocks = vi.hoisted(() => ({
  getPacks: vi.fn(),
  generatorForm: vi.fn(),
}));

vi.mock("@/lib/services/achievement-pack-service-server", () => ({
  getAchievementPacks: mocks.getPacks,
}));

vi.mock("@/components/admin/achievement-generator-form", () => ({
  AchievementGeneratorForm: (props: unknown) => {
    mocks.generatorForm(props);
    return null;
  },
}));

import AchievementGeneratorPage from "@/app/admin/achievement-generator/page";

const pack: AchievementPack = {
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
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPacks.mockReset();
  mocks.getPacks.mockResolvedValue([pack]);
});

async function render(): Promise<HTMLDivElement> {
  const element = await AchievementGeneratorPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("AchievementGeneratorPage", () => {
  it("renders the heading and instructions", async () => {
    const container = await render();

    expect(container.querySelector("main")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(
      "Achievement Generator",
    );
    expect(container.querySelector("p")?.textContent).toBe(
      "Generate achievement drafts for a selected pack.",
    );
  });

  it("loads packs and passes them to the generator form", async () => {
    await render();

    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.generatorForm).toHaveBeenCalledExactlyOnceWith({
      packs: [pack],
    });
  });

  it("passes an empty pack list to the generator form", async () => {
    mocks.getPacks.mockResolvedValue([]);

    await render();

    expect(mocks.generatorForm).toHaveBeenCalledExactlyOnceWith({
      packs: [],
    });
  });

  it("propagates a pack-loading failure", async () => {
    const error = new Error("Pack service unavailable");
    mocks.getPacks.mockRejectedValue(error);

    await expect(AchievementGeneratorPage()).rejects.toBe(error);
    expect(mocks.generatorForm).not.toHaveBeenCalled();
  });
});
