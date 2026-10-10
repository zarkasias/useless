// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementGeneratorState } from "@/lib/ai/types/achievement-generator-state";
import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";
import type { AchievementPack } from "@/lib/types/achievement-pack";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  action: vi.fn(),
  formAction: vi.fn(),
  generatedCard: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/admin/achievement-generator/actions", () => ({
  generateAchievementsAction: mocks.action,
}));

vi.mock("@/components/admin/generated-achievement-card", () => ({
  GeneratedAchievementCard: (props: unknown) => {
    mocks.generatedCard(props);
    return null;
  },
}));

import { AchievementGeneratorForm } from "@/components/admin/achievement-generator-form";

const initialState: AchievementGeneratorState = {
  success: false,
  error: null,
  packId: null,
  achievements: [],
};

const draft: GeneratedAchievementDraft = {
  title: "Tab Collector",
  description: "Open an unnecessary number of tabs.",
  rarity: "COMMON",
  emoji: "🏆",
  triggerType: "daily_claim",
  triggerConfig: {
    startHour: null,
    startMinute: null,
    endHour: null,
    endMinute: null,
    month: null,
    day: null,
    days: null,
    count: null,
    rarity: null,
    packSlug: null,
  },
  iconConcept: "A stack of browser tabs",
  imagePrompt: "A playful trophy made of browser tabs",
};

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
  mocks.useActionState.mockReturnValue([initialState, mocks.formAction, false]);
});

function render(packs: AchievementPack[] = [pack]): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(AchievementGeneratorForm, { packs }),
  );
  return container;
}

describe("AchievementGeneratorForm", () => {
  it("initializes action state and renders required fields and pack options", () => {
    const container = render();

    expect(mocks.useActionState).toHaveBeenCalledWith(
      mocks.action,
      initialState,
    );

    const select = container.querySelector("select");
    expect(select?.name).toBe("packId");
    expect(select?.required).toBe(true);
    expect(
      Array.from(select?.options ?? [], (option) => ({
        value: option.value,
        label: option.textContent,
      })),
    ).toEqual([
      { value: "", label: "Select a pack" },
      { value: "pack-1", label: "Internet Habits" },
    ]);

    const theme = container.querySelector<HTMLInputElement>("#theme");
    expect(theme?.required).toBe(true);
    expect(theme?.name).toBe("theme");

    const instructions = container.querySelector("textarea");
    expect(instructions?.name).toBe("instructions");
    expect(instructions?.required).toBe(false);
    expect(instructions?.rows).toBe(5);
    expect(container.querySelector("button")?.disabled).toBe(false);
    expect(container.querySelector("button")?.textContent).toBe(
      "Generate Drafts",
    );
  });

  it("defaults all rarity counts to two with a minimum of zero", () => {
    const container = render();

    for (const rarity of ["common", "rare", "epic", "legendary"]) {
      const input = container.querySelector<HTMLInputElement>(`#${rarity}`);
      expect(input?.name).toBe(rarity);
      expect(input?.type).toBe("number");
      expect(input?.value).toBe("2");
      expect(input?.min).toBe("0");
    }
  });

  it("supports an empty pack list and hides generated results initially", () => {
    const container = render([]);

    expect(container.querySelectorAll("option")).toHaveLength(1);
    expect(container.querySelector("h2")).toBeNull();
    expect(mocks.generatedCard).not.toHaveBeenCalled();
  });

  it("disables submission while generation is pending", () => {
    mocks.useActionState.mockReturnValue([
      initialState,
      mocks.formAction,
      true,
    ]);

    const container = render();

    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("button")?.textContent).toBe(
      "Generating achievements...",
    );
  });

  it("shows an action error and allows another attempt", () => {
    mocks.useActionState.mockReturnValue([
      { ...initialState, error: "Generation failed. Try again." },
      mocks.formAction,
      false,
    ]);

    const container = render();

    expect(container.textContent).toContain("Generation failed. Try again.");
    expect(container.querySelector("button")?.disabled).toBe(false);
  });

  it("passes every generated draft and its pack ID to draft cards", () => {
    const secondDraft = { ...draft, title: "Refresh Enthusiast" };
    mocks.useActionState.mockReturnValue([
      {
        ...initialState,
        success: true,
        packId: pack.id,
        achievements: [draft, secondDraft],
      },
      mocks.formAction,
      false,
    ]);

    const container = render();

    expect(container.querySelector("h2")?.textContent).toBe("Generated Drafts");
    expect(container.textContent).toContain("Nothing has been saved yet.");
    expect(mocks.generatedCard.mock.calls.map(([props]) => props)).toEqual([
      { achievement: draft, packId: pack.id },
      { achievement: secondDraft, packId: pack.id },
    ]);
  });

  it("does not render draft cards without a result pack ID", () => {
    mocks.useActionState.mockReturnValue([
      { ...initialState, achievements: [draft], packId: null },
      mocks.formAction,
      false,
    ]);

    const container = render();

    expect(container.querySelector("h2")?.textContent).toBe("Generated Drafts");
    expect(mocks.generatedCard).not.toHaveBeenCalled();
  });
});
