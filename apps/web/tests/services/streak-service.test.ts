import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

import {
  getAuthenticatedUserStreakData,
  getUserStreakData,
} from "@/lib/services/streak-service-server";

const EMPTY = {
  currentStreak: 0,
  longestStreak: 0,
  achievementDates: [],
  claimedToday: false,
};

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function enqueueDates(
  dates: Array<string | null>,
  profile: { timezone?: string | null } | null = { timezone: "UTC" },
) {
  const query = db.enqueue("user_achievements", {
    data: dates.map((achievement_date) => ({ achievement_date })),
  });

  db.enqueue("profiles", { data: profile });

  return query;
}

describe("getUserStreakData", () => {
  it.each([null, []])(
    "returns empty streaks for no records: %j",
    async (data) => {
      db.enqueue("user_achievements", { data });

      await expect(getUserStreakData("user-1")).resolves.toEqual(EMPTY);
      expect(db.from).toHaveBeenCalledTimes(1);
    },
  );

  it("ignores records without a claim date", async () => {
    db.enqueue("user_achievements", {
      data: [{ achievement_date: null }, { achievement_date: "" }, {}],
    });

    await expect(getUserStreakData("user-1")).resolves.toEqual(EMPTY);
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("returns empty streaks and logs a failed date lookup", async () => {
    const error = { message: "Database unavailable" };
    db.enqueue("user_achievements", { error });

    await expect(getUserStreakData("user-1")).resolves.toEqual(EMPTY);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching achievement dates:",
      error,
    );
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("sorts dates and counts multiple claims on one day only once", async () => {
    const query = enqueueDates([
      "2026-10-07",
      "2026-10-05",
      null,
      "2026-10-06",
      "2026-10-07",
    ]);

    await expect(getUserStreakData("user-1")).resolves.toEqual({
      currentStreak: 3,
      longestStreak: 3,
      achievementDates: ["2026-10-05", "2026-10-06", "2026-10-07"],
      claimedToday: true,
    });

    expect(query.select).toHaveBeenCalledWith("achievement_date");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.order).toHaveBeenCalledWith("achievement_date", {
      ascending: true,
    });
    expect(db.queries[1].eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("keeps the current streak alive when the last claim was yesterday", async () => {
    enqueueDates(["2026-10-04", "2026-10-05", "2026-10-06"]);

    await expect(getUserStreakData("user-1")).resolves.toMatchObject({
      currentStreak: 3,
      longestStreak: 3,
      claimedToday: false,
    });
  });

  it("resets the current streak after a missed day but preserves the best", async () => {
    enqueueDates(["2026-10-03", "2026-10-04", "2026-10-05"]);

    await expect(getUserStreakData("user-1")).resolves.toMatchObject({
      currentStreak: 0,
      longestStreak: 3,
      claimedToday: false,
    });
  });

  it("keeps an older longest streak when today's run is shorter", async () => {
    enqueueDates([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-06",
      "2026-10-07",
    ]);

    await expect(getUserStreakData("user-1")).resolves.toMatchObject({
      currentStreak: 2,
      longestStreak: 4,
      claimedToday: true,
    });
  });

  it.each([
    {
      now: "2027-01-01T12:00:00.000Z",
      dates: ["2026-12-30", "2026-12-31", "2027-01-01"],
    },
    {
      now: "2028-03-01T12:00:00.000Z",
      dates: ["2028-02-28", "2028-02-29", "2028-03-01"],
    },
  ])(
    "counts consecutive days across calendar boundaries: $now",
    async ({ now, dates }) => {
      vi.setSystemTime(new Date(now));
      enqueueDates(dates);

      await expect(getUserStreakData("user-1")).resolves.toMatchObject({
        currentStreak: 3,
        longestStreak: 3,
        claimedToday: true,
      });
    },
  );

  it.each([
    ["America/New_York", false],
    ["UTC", true],
  ])(
    "uses the profile timezone %s to determine today",
    async (timezone, claimedToday) => {
      vi.setSystemTime(new Date("2026-10-07T02:00:00.000Z"));
      enqueueDates(["2026-10-05", "2026-10-06"], { timezone });

      await expect(getUserStreakData("user-1")).resolves.toMatchObject({
        currentStreak: 2,
        longestStreak: 2,
        claimedToday: !claimedToday,
      });
    },
  );

  it.each([null, {}, { timezone: null }])(
    "defaults to UTC when the profile timezone is missing: %j",
    async (profile) => {
      vi.setSystemTime(new Date("2026-10-07T02:00:00.000Z"));
      enqueueDates(["2026-10-07"], profile);

      await expect(getUserStreakData("user-1")).resolves.toMatchObject({
        currentStreak: 1,
        claimedToday: true,
      });
    },
  );
});

describe("getAuthenticatedUserStreakData", () => {
  it("loads streaks for the authenticated user", async () => {
    const query = enqueueDates(["2026-10-07"]);

    await expect(getAuthenticatedUserStreakData()).resolves.toMatchObject({
      currentStreak: 1,
      longestStreak: 1,
      claimedToday: true,
    });

    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns empty streaks without querying claims when signed out", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(getAuthenticatedUserStreakData()).resolves.toEqual(EMPTY);
    expect(db.from).not.toHaveBeenCalled();
  });

  it("does not load claims when authentication returns an error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "Session expired" },
    });

    await expect(getAuthenticatedUserStreakData()).resolves.toEqual(EMPTY);
    expect(db.from).not.toHaveBeenCalled();
  });
});
