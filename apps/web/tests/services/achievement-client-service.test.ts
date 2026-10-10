import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

import {
  getLeaderboardUsers,
  getUserAchievements,
  getUserProfile,
  unlockAchievement,
} from "@/lib/services/achievement-service";

let db: ReturnType<typeof database>;

const achievement: Achievement = {
  id: "achievement-1",
  title: "An unnecessary accomplishment",
  description: "You did the thing.",
  type: "COMMON",
  emoji: "🏆",
  created_at: "2026-10-01T12:00:00.000Z",
  is_daily: true,
  is_secret: false,
  trigger_type: "daily_claim",
  trigger_config: {},
  status: "published",
};

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.rpc.mockReset();

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getUserAchievements", () => {
  it("maps joined achievements using the user's claim timestamp", async () => {
    const claimedAt = "2026-10-07T12:00:00.000Z";
    const query = db.enqueue("user_achievements", {
      data: [
        {
          id: "claim-1",
          user_id: "user-1",
          created_at: claimedAt,
          achievements: [achievement],
        },
        {
          id: "claim-2",
          user_id: "user-1",
          created_at: claimedAt,
          achievements: null,
        },
      ],
    });

    await expect(getUserAchievements("user-1")).resolves.toEqual([
      {
        ...achievement,
        user_id: "user-1",
        created_at: claimedAt,
      },
    ]);

    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining("achievements ("),
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it.each([
    { label: "null data", data: null },
    { label: "an empty list", data: [] },
  ])("returns an empty list for $label", async ({ data }) => {
    db.enqueue("user_achievements", { data });

    await expect(getUserAchievements("user-1")).resolves.toEqual([]);
  });

  it("logs query errors and returns an empty list", async () => {
    const error = { message: "Lookup failed" };
    db.enqueue("user_achievements", { error });

    await expect(getUserAchievements("user-1")).resolves.toEqual([]);

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching user achievements:",
      error,
    );
  });
});

describe("getUserProfile", () => {
  it("returns the requested profile", async () => {
    const profile = {
      id: "user-1",
      username: "Player",
      role: "user",
      created_at: "2026-10-01T12:00:00.000Z",
      streak_count: 3,
    };
    const query = db.enqueue("profiles", { data: profile });

    await expect(getUserProfile("user-1")).resolves.toEqual(profile);

    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(query.single).toHaveBeenCalledOnce();
  });

  it("returns null when no profile exists", async () => {
    db.enqueue("profiles", { data: null });

    await expect(getUserProfile("user-1")).resolves.toBeNull();
  });

  it("logs query errors and returns null", async () => {
    const error = { message: "Profile unavailable" };
    db.enqueue("profiles", { error });

    await expect(getUserProfile("user-1")).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching user profile:",
      error,
    );
  });
});

describe("unlockAchievement", () => {
  it("records the unlock and returns the achievement with saved claim details", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));

    const savedTimestamp = "2026-10-07T12:00:01.000Z";
    const query = db.enqueue("user_achievements", {
      data: {
        user_id: "user-1",
        created_at: savedTimestamp,
      },
    });

    await expect(unlockAchievement("user-1", achievement)).resolves.toEqual({
      ...achievement,
      user_id: "user-1",
      created_at: savedTimestamp,
    });

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      achievement_id: "achievement-1",
      created_at: "2026-10-07T12:00:00.000Z",
    });
    expect(query.select).toHaveBeenCalledWith();
    expect(query.single).toHaveBeenCalledOnce();
    expect(achievement.created_at).toBe("2026-10-01T12:00:00.000Z");
    expect(achievement.user_id).toBeUndefined();
  });

  it("logs insertion errors and returns null", async () => {
    const error = { message: "Insert failed" };
    db.enqueue("user_achievements", { error });

    await expect(unlockAchievement("user-1", achievement)).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith(
      "Error unlocking achievement:",
      error,
    );
  });
});

describe("getLeaderboardUsers", () => {
  it("requests the default limit and returns leaderboard records", async () => {
    const users = [
      {
        id: "user-1",
        username: "Player",
        role: "user",
        created_at: "2026-10-01T12:00:00.000Z",
        streak_count: 3,
        achievementCount: 12,
      },
    ];
    mocks.rpc.mockResolvedValue({ data: users, error: null });

    await expect(getLeaderboardUsers()).resolves.toEqual(users);

    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_leaderboard_users", {
      limit_count: 10,
    });
  });

  it("forwards a custom limit", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });

    await expect(getLeaderboardUsers(25)).resolves.toEqual([]);

    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_leaderboard_users", {
      limit_count: 25,
    });
  });

  it("returns an empty list when the RPC returns null data", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(getLeaderboardUsers()).resolves.toEqual([]);
  });

  it("logs RPC errors and returns an empty list", async () => {
    const error = { message: "Leaderboard unavailable" };
    mocks.rpc.mockResolvedValue({ data: null, error });

    await expect(getLeaderboardUsers()).resolves.toEqual([]);

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching leaderboard:",
      error,
    );
  });
});
