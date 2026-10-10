import { describe, expect, it } from "vitest";
import { isDailyAchievementEligible } from "@/lib/services/utils/daily-claim-eligible";
import type { Achievement } from "@/lib/supabase";

function makeAchievement(
  triggerConfig: Record<string, unknown> | null,
): Achievement {
  return {
    id: "test-id",
    title: "Test Achievement",
    description: "Test",
    type: "COMMON",
    emoji: "🏆",
    created_at: "2026-01-01T00:00:00Z",
    is_daily: true,
    is_secret: false,
    trigger_type: "daily_claim",
    trigger_config: triggerConfig,
    status: "published",
  };
}

describe("isDailyAchievementEligible", () => {
  it("allows unrestricted daily claims", () => {
    const achievement = makeAchievement({});

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-09-16T16:00:00Z"),
      ),
    ).toBe(true);
  });

  it("allows Wednesday achievement on Wednesday", () => {
    const achievement = makeAchievement({
      days: ["wednesday"],
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-09-16T16:00:00Z"),
      ),
    ).toBe(true);
  });

  it("rejects Wednesday achievement on Thursday", () => {
    const achievement = makeAchievement({
      days: ["wednesday"],
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-09-17T16:00:00Z"),
      ),
    ).toBe(false);
  });

  it("allows Christmas Clicker on December 25", () => {
    const achievement = makeAchievement({
      month: 12,
      day: 25,
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-12-25T17:00:00Z"),
      ),
    ).toBe(true);
  });

  it("rejects Christmas Clicker on December 24", () => {
    const achievement = makeAchievement({
      month: 12,
      day: 25,
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-12-24T17:00:00Z"),
      ),
    ).toBe(false);
  });

  it("allows Midnight Oil between 12 and 1 AM", () => {
    const achievement = makeAchievement({
      startHour: 0,
      startMinute: 0,
      endHour: 0,
      endMinute: 59,
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-09-17T04:30:00Z"),
      ),
    ).toBe(true);
  });

  it("rejects Midnight Oil after 1 AM", () => {
    const achievement = makeAchievement({
      startHour: 0,
      startMinute: 0,
      endHour: 0,
      endMinute: 59,
    });

    expect(
      isDailyAchievementEligible(
        achievement,
        "America/New_York",
        new Date("2026-09-17T05:30:00Z"),
      ),
    ).toBe(false);
  });
});
