import { describe, expect, it } from "vitest";

import { isSupportedTrigger } from "@/lib/achievements/validate-trigger";
import { validateTriggerConfig } from "@/lib/achievements/validate-trigger-config";
import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";

type Config = GeneratedAchievementDraft["triggerConfig"];

function draft(
  triggerType: GeneratedAchievementDraft["triggerType"],
  config: Partial<Config> = {},
): GeneratedAchievementDraft {
  return {
    title: "Pointless milestone",
    description: "An unnecessary achievement",
    rarity: "COMMON",
    emoji: "🏆",
    triggerType,
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
      ...config,
    },
    iconConcept: "A trophy",
    imagePrompt: "A colorful trophy",
  };
}

describe("supported achievement triggers", () => {
  it.each([
    "daily_claim",
    "login_time",
    "login_date",
    "consecutive_days",
    "achievement_count",
    "rarity_count",
    "pack_completion",
    "account_age",
  ])("accepts %s", (trigger) => {
    expect(isSupportedTrigger(trigger)).toBe(true);
  });

  it.each(["", "unknown", "DAILY_CLAIM", " daily_claim", "daily_claim "])(
    "rejects unsupported trigger %j",
    (trigger) => {
      expect(isSupportedTrigger(trigger)).toBe(false);
    },
  );
});

describe("daily claim configuration", () => {
  it("requires no additional configuration", () => {
    expect(validateTriggerConfig(draft("daily_claim"))).toBe(true);
  });
});

describe("login-time configuration", () => {
  const valid: Partial<Config> = {
    startHour: 0,
    startMinute: 0,
    endHour: 23,
    endMinute: 59,
  };

  it("accepts inclusive hour and minute boundaries", () => {
    expect(validateTriggerConfig(draft("login_time", valid))).toBe(true);
  });

  it("accepts a time range crossing midnight", () => {
    expect(
      validateTriggerConfig(
        draft("login_time", {
          startHour: 23,
          startMinute: 30,
          endHour: 1,
          endMinute: 15,
        }),
      ),
    ).toBe(true);
  });

  const invalidCases: Array<{
    field: keyof Config;
    value: number | null;
  }> = [
    { field: "startHour", value: null },
    { field: "startHour", value: -1 },
    { field: "startHour", value: 24 },
    { field: "endHour", value: null },
    { field: "endHour", value: -1 },
    { field: "endHour", value: 24 },
    { field: "startMinute", value: null },
    { field: "startMinute", value: -1 },
    { field: "startMinute", value: 60 },
    { field: "endMinute", value: null },
    { field: "endMinute", value: -1 },
    { field: "endMinute", value: 60 },
  ];

  it.each(invalidCases)("rejects $field=$value", ({ field, value }) => {
    expect(
      validateTriggerConfig(
        draft("login_time", {
          ...valid,
          [field]: value,
        }),
      ),
    ).toBe(false);
  });
});

describe("login-date configuration", () => {
  it.each([
    { month: 1, day: 1 },
    { month: 12, day: 31 },
  ])("accepts month $month and day $day", (config) => {
    expect(validateTriggerConfig(draft("login_date", config))).toBe(true);
  });

  it.each([
    { month: null, day: 1 },
    { month: 0, day: 1 },
    { month: 13, day: 1 },
    { month: 1, day: null },
    { month: 1, day: 0 },
    { month: 1, day: 32 },
  ])("rejects month $month and day $day", (config) => {
    expect(validateTriggerConfig(draft("login_date", config))).toBe(false);
  });
});

describe("day-count configuration", () => {
  for (const trigger of ["consecutive_days", "account_age"] as const) {
    it(`${trigger} accepts a positive day count`, () => {
      expect(validateTriggerConfig(draft(trigger, { days: 1 }))).toBe(true);
    });

    it.each([{ days: null }, { days: 0 }, { days: -1 }])(
      `${trigger} rejects days=$days`,
      (config) => {
        expect(validateTriggerConfig(draft(trigger, config))).toBe(false);
      },
    );
  }
});

describe("achievement-count configuration", () => {
  it("accepts a positive count", () => {
    expect(
      validateTriggerConfig(
        draft("achievement_count", {
          count: 1,
        }),
      ),
    ).toBe(true);
  });

  it.each([{ count: null }, { count: 0 }, { count: -1 }])(
    "rejects count=$count",
    (config) => {
      expect(validateTriggerConfig(draft("achievement_count", config))).toBe(
        false,
      );
    },
  );
});

describe("rarity-count configuration", () => {
  it.each(["COMMON", "RARE", "EPIC", "LEGENDARY"] as const)(
    "accepts %s with a positive count",
    (rarity) => {
      expect(
        validateTriggerConfig(
          draft("rarity_count", {
            rarity,
            count: 1,
          }),
        ),
      ).toBe(true);
    },
  );

  it("rejects a missing rarity", () => {
    expect(
      validateTriggerConfig(
        draft("rarity_count", {
          rarity: null,
          count: 1,
        }),
      ),
    ).toBe(false);
  });

  it.each([{ count: null }, { count: 0 }, { count: -1 }])(
    "rejects rarity count=$count",
    ({ count }) => {
      expect(
        validateTriggerConfig(
          draft("rarity_count", {
            rarity: "COMMON",
            count,
          }),
        ),
      ).toBe(false);
    },
  );
});

describe("pack-completion configuration", () => {
  it.each(["pointless-pack", " pointless-pack "])(
    "accepts a nonblank slug %j",
    (packSlug) => {
      expect(
        validateTriggerConfig(
          draft("pack_completion", {
            packSlug,
          }),
        ),
      ).toBe(true);
    },
  );

  it.each([{ packSlug: null }, { packSlug: "" }, { packSlug: "   " }])(
    "rejects blank slug $packSlug",
    (config) => {
      expect(validateTriggerConfig(draft("pack_completion", config))).toBe(
        false,
      );
    },
  );
});

it("rejects an unsupported configuration trigger at runtime", () => {
  const achievement = {
    ...draft("daily_claim"),
    triggerType: "unknown",
  } as unknown as GeneratedAchievementDraft;

  expect(validateTriggerConfig(achievement)).toBe(false);
});
