// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";
import type { SaveAchievementDraftState } from "@/lib/ai/types/save-achievement-draft-state";

const mocks = vi.hoisted(() => ({
  useActionState: vi.fn(),
  action: vi.fn(),
  formAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: mocks.useActionState };
});

vi.mock("@/app/admin/achievement-generator/actions", () => ({
  saveGeneratedAchievementDraftAction: mocks.action,
}));

import { GeneratedAchievementCard } from "@/components/admin/generated-achievement-card";

const initialState: SaveAchievementDraftState = {
  success: false,
  error: null,
  achievementId: null,
};

const achievement: GeneratedAchievementDraft = {
  title: "Tab Collector",
  description: "Open an unnecessary number of tabs.",
  rarity: "RARE",
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
  imagePrompt: 'A playful trophy with "tabs" & sparkles',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useActionState.mockReturnValue([initialState, mocks.formAction, false]);
});

function render(): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(GeneratedAchievementCard, {
      achievement,
      packId: "pack-1",
    }),
  );
  return container;
}

describe("GeneratedAchievementCard", () => {
  it("renders the draft details and formatted trigger configuration", () => {
    const container = render();

    for (const text of [
      achievement.title,
      achievement.description,
      achievement.rarity,
      achievement.emoji,
      achievement.triggerType,
      achievement.iconConcept,
      achievement.imagePrompt,
    ]) {
      expect(container.textContent).toContain(text);
    }

    expect(container.querySelector("pre")?.textContent).toBe(
      JSON.stringify(achievement.triggerConfig, null, 2),
    );
  });

  it("initializes save state and enables the Save Draft button", () => {
    const container = render();

    expect(mocks.useActionState).toHaveBeenCalledWith(
      mocks.action,
      initialState,
    );
    expect(container.querySelector("button")?.type).toBe("submit");
    expect(container.querySelector("button")?.disabled).toBe(false);
    expect(container.querySelector("button")?.textContent?.trim()).toBe(
      "Save Draft",
    );
    expect(container.textContent).not.toContain(
      "Saved to the achievement database.",
    );
  });

  it("includes the pack ID and complete serialized draft in the form", () => {
    const container = render();
    const packInput = container.querySelector<HTMLInputElement>(
      'form input[name="packId"]',
    );
    const draftInput = container.querySelector<HTMLInputElement>(
      'form input[name="draft"]',
    );

    expect(packInput?.type).toBe("hidden");
    expect(packInput?.value).toBe("pack-1");
    expect(draftInput?.type).toBe("hidden");
    expect(draftInput?.value).toBe(JSON.stringify(achievement));
    expect(JSON.parse(draftInput!.value)).toEqual(achievement);
  });

  it("disables saving and shows progress while pending", () => {
    mocks.useActionState.mockReturnValue([
      initialState,
      mocks.formAction,
      true,
    ]);

    const container = render();

    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("button")?.textContent?.trim()).toBe(
      "Saving draft...",
    );
    expect(container.querySelector("button .animate-spin")).not.toBeNull();
  });

  it("confirms a successful save and prevents another submission", () => {
    mocks.useActionState.mockReturnValue([
      {
        success: true,
        error: null,
        achievementId: "achievement-1",
      },
      mocks.formAction,
      false,
    ]);

    const container = render();

    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("button")?.textContent?.trim()).toBe(
      "Draft saved",
    );
    expect(container.textContent).toContain(
      "Saved to the achievement database.",
    );
  });

  it("shows a save error and allows retrying", () => {
    mocks.useActionState.mockReturnValue([
      {
        ...initialState,
        error: "Unable to save this draft.",
      },
      mocks.formAction,
      false,
    ]);

    const container = render();

    expect(container.textContent).toContain("Unable to save this draft.");
    expect(container.querySelector("button")?.disabled).toBe(false);
    expect(container.querySelector("button")?.textContent?.trim()).toBe(
      "Save Draft",
    );
    expect(container.textContent).not.toContain(
      "Saved to the achievement database.",
    );
  });
});
