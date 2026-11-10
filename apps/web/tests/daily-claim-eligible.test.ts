import { describe, expect, it } from "vitest";
import {
  getNextDailyEligibility,
  isDailyAchievementEligible,
} from "@/lib/services/utils/daily-claim-eligible";
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

describe("getNextDailyEligibility", () => {
  // 2026-11-10 is a Tuesday; 15:00Z is 10:00 in New York.
  const now = new Date("2026-11-10T15:00:00Z");

  it("returns the start of the next time window today", () => {
    const evening = makeAchievement({
      startHour: 17,
      startMinute: 0,
      endHour: 20,
      endMinute: 59,
    });

    expect(
      getNextDailyEligibility(
        [evening],
        "America/New_York",
        now,
      )?.toISOString(),
    ).toBe("2026-11-10T22:00:00.000Z");
  });

  it("returns the earliest opening across several achievements", () => {
    const thursday = makeAchievement({ days: ["thursday"] });
    const afternoon = makeAchievement({ startHour: 13, endHour: 16 });

    expect(
      getNextDailyEligibility(
        [thursday, afternoon],
        "America/New_York",
        now,
      )?.toISOString(),
    ).toBe("2026-11-10T18:00:00.000Z");
  });

  it("rolls over to the start of the matching weekday", () => {
    const thursday = makeAchievement({ days: ["thursday"] });

    expect(
      getNextDailyEligibility(
        [thursday],
        "America/New_York",
        now,
      )?.toISOString(),
    ).toBe("2026-11-12T05:00:00.000Z");
  });

  it("returns null when nothing opens within a week", () => {
    const halloween = makeAchievement({ month: 10, day: 31 });

    expect(
      getNextDailyEligibility([halloween], "America/New_York", now),
    ).toBeNull();
  });

  it("returns null when there is nothing left to claim", () => {
    expect(getNextDailyEligibility([], "America/New_York", now)).toBeNull();
  });
});
