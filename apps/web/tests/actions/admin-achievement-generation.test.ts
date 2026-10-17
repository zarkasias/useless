import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementGeneratorState } from "@/lib/ai/types/achievement-generator-state";

const mocks = vi.hoisted(() => ({
  generateAchievementDrafts: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({}),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/services/achievement-generator-service-server", () => ({
  generateAchievementDrafts: mocks.generateAchievementDrafts,
}));

import { generateAchievementsAction } from "@/app/admin/achievement-generator/actions";

const initialState: AchievementGeneratorState = {
  success: false,
  error: null,
  packId: null,
  achievements: [],
};

function makeForm(values: Record<string, string> = {}) {
  const form = new FormData();

  const fields = {
    packId: "pack-1",
    theme: "Unnecessary accomplishments",
    common: "1",
    ...values,
  };

  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }

  return form;
}

beforeEach(() => {
  mocks.generateAchievementDrafts.mockReset();
  mocks.generateAchievementDrafts.mockResolvedValue([]);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("generateAchievementsAction", () => {
  it("trims text and forwards numeric counts to the generator", async () => {
    const achievements = [
      {
        title: "Professional Procrastinator",
        description: "Eventually.",
        rarity: "COMMON",
        emoji: "🏆",
      },
    ];
    mocks.generateAchievementDrafts.mockResolvedValue(achievements);

    const form = makeForm({
      packId: "  pack-1  ",
      theme: "  Unnecessary accomplishments  ",
      instructions: "  Keep it silly.  ",
      common: "2",
      rare: "3",
      epic: "1",
      legendary: "1",
    });

    await expect(
      generateAchievementsAction(initialState, form),
    ).resolves.toEqual({
      success: true,
      error: null,
      packId: "pack-1",
      achievements,
    });

    expect(mocks.generateAchievementDrafts).toHaveBeenCalledExactlyOnceWith({
      packId: "pack-1",
      theme: "Unnecessary accomplishments",
      instructions: "Keep it silly.",
      counts: {
        common: 2,
        rare: 3,
        epic: 1,
        legendary: 1,
      },
    });
  });

  it.each([
    { label: "missing", instructions: undefined },
    { label: "blank", instructions: "   " },
  ])(
    "omits $label instructions and defaults missing counts to zero",
    async ({ instructions }) => {
      const form = makeForm();

      if (instructions !== undefined) {
        form.set("instructions", instructions);
      }

      await generateAchievementsAction(initialState, form);

      expect(mocks.generateAchievementDrafts).toHaveBeenCalledExactlyOnceWith({
        packId: "pack-1",
        theme: "Unnecessary accomplishments",
        instructions: undefined,
        counts: {
          common: 1,
          rare: 0,
          epic: 0,
          legendary: 0,
        },
      });
    },
  );

  it.each([
    {
      label: "missing pack",
      field: "packId",
      value: undefined,
      error: "Please select an achievement pack.",
    },
    {
      label: "blank pack",
      field: "packId",
      value: "   ",
      error: "Please select an achievement pack.",
    },
    {
      label: "missing theme",
      field: "theme",
      value: undefined,
      error: "Please enter a theme.",
    },
    {
      label: "blank theme",
      field: "theme",
      value: "   ",
      error: "Please enter a theme.",
    },
  ])(
    "rejects a $label without calling the generator",
    async ({ field, value, error }) => {
      const form = makeForm();

      if (value === undefined) {
        form.delete(field);
      } else {
        form.set(field, value);
      }

      await expect(
        generateAchievementsAction(initialState, form),
      ).resolves.toEqual({
        success: false,
        error,
        packId: null,
        achievements: [],
      });

      expect(mocks.generateAchievementDrafts).not.toHaveBeenCalled();
    },
  );

  it.each([
    { label: "zero", common: "0" },
    { label: "negative", common: "-1" },
  ])("rejects a $label total achievement count", async ({ common }) => {
    await expect(
      generateAchievementsAction(initialState, makeForm({ common })),
    ).resolves.toEqual({
      success: false,
      error: "Generate at least one achievement.",
      packId: null,
      achievements: [],
    });

    expect(mocks.generateAchievementDrafts).not.toHaveBeenCalled();
  });

  it("rejects a form with no count fields", async () => {
    const form = makeForm();
    form.delete("common");

    await expect(
      generateAchievementsAction(initialState, form),
    ).resolves.toEqual({
      success: false,
      error: "Generate at least one achievement.",
      packId: null,
      achievements: [],
    });

    expect(mocks.generateAchievementDrafts).not.toHaveBeenCalled();
  });

  it("returns and logs an Error from the generator", async () => {
    const error = new Error("Generation unavailable");
    mocks.generateAchievementDrafts.mockRejectedValue(error);

    await expect(
      generateAchievementsAction(initialState, makeForm()),
    ).resolves.toEqual({
      success: false,
      error: "Generation unavailable",
      packId: null,
      achievements: [],
    });

    expect(console.error).toHaveBeenCalledWith(
      "Achievement generation failed:",
      error,
    );
  });

  it("uses the fallback message for non-Error failures", async () => {
    mocks.generateAchievementDrafts.mockRejectedValue("Unexpected failure");

    await expect(
      generateAchievementsAction(initialState, makeForm()),
    ).resolves.toEqual({
      success: false,
      error: "Unable to generate achievements.",
      packId: null,
      achievements: [],
    });
  });
});
