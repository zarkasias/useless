import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type { TriggerDefinition } from "@/lib/types/triggers";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  getStreakData: vi.fn(),
  getPackFilter: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/services/utils/achievement-utils", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/services/utils/achievement-utils")
    >();

  return {
    ...actual,
    getAuthenticatedUser: mocks.getUser,
  };
});

vi.mock("@/lib/services/streak-service-server", () => ({
  getUserStreakData: mocks.getStreakData,
}));

vi.mock("@/lib/services/achievement-access-service-server", () => ({
  getAchievementPackFilter: mocks.getPackFilter,
}));

import { evaluateTriggeredAchievementsForAuthenticatedUser } from "@/lib/services/achievement-service-server";

const USER_ID = "user-1";
const NOW = new Date("2026-10-22T12:00:00.000Z");
const AWARDED_AT = NOW.toISOString();

const PACK_FILTER = "pack_id.is.null,pack_id.in.(core)";

type TriggerType = "account_age" | "streak" | "collection_count";

let db: ReturnType<typeof database>;

function definition(
  trigger: TriggerType,
  id: string,
  threshold: number,
): TriggerDefinition {
  return {
    id,
    title: `Achievement ${id}`,
    description: "A milestone achievement",
    type: "COMMON",
    emoji: "🏆",
    icon_path: null,
    is_secret: false,
    status: "published",
    trigger_type: trigger,
    trigger_config:
      trigger === "collection_count"
        ? { count: threshold }
        : { days: threshold },
  };
}

function ownedIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `existing-${index}`);
}

function enqueueOwnership(ids: string[]) {
  return db.enqueue("user_achievements", {
    data: ids.map((achievement_id) => ({ achievement_id })),
  });
}

function enqueueAward() {
  return db.enqueue("user_achievements", {
    data: { created_at: AWARDED_AT },
  });
}

function enqueueDefinitions(definitions: TriggerDefinition[]) {
  return db.enqueue("achievements", {
    data: definitions,
  });
}

function enqueueProfile(ageInDays: number) {
  return db.enqueue("profiles", {
    data: {
      created_at: new Date(
        NOW.getTime() - ageInDays * 86_400_000,
      ).toISOString(),
    },
  });
}

beforeEach(() => {
  db = database();

  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);

  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ id: USER_ID });

  mocks.getStreakData.mockReset();
  mocks.getStreakData.mockResolvedValue({
    currentStreak: 3,
    longestStreak: 3,
    achievementDates: [],
    claimedToday: true,
  });

  mocks.getPackFilter.mockReset();
  mocks.getPackFilter.mockResolvedValue(PACK_FILTER);

  vi.useFakeTimers();
  vi.setSystemTime(NOW);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("trigger orchestration", () => {
  it("awards account-age and streak milestones before evaluating collection count", async () => {
    const definitions = [
      definition("account_age", "age-award", 7),
      definition("streak", "streak-award", 3),
      definition("collection_count", "collection-award", 10),
    ];

    const initialIds = ownedIds(8);

    const catalogQuery = enqueueDefinitions(definitions);

    enqueueProfile(30);

    // Account age sees the original 8.
    enqueueOwnership(initialIds);
    const ageInsert = enqueueAward();

    // Streak sees the account-age award.
    enqueueOwnership([...initialIds, "age-award"]);
    const streakInsert = enqueueAward();

    // Collection count sees both newly awarded achievements.
    const collectionOwnership = enqueueOwnership([
      ...initialIds,
      "age-award",
      "streak-award",
    ]);
    const collectionInsert = enqueueAward();

    const result = await evaluateTriggeredAchievementsForAuthenticatedUser();

    expect(result.map(({ id }) => id)).toEqual([
      "age-award",
      "streak-award",
      "collection-award",
    ]);

    expect(ageInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "age-award",
    });

    expect(streakInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "streak-award",
    });

    expect(collectionInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "collection-award",
    });

    // Confirm sequential award order.
    expect(ageInsert.insert.mock.invocationCallOrder[0]).toBeLessThan(
      streakInsert.insert.mock.invocationCallOrder[0],
    );

    expect(streakInsert.insert.mock.invocationCallOrder[0]).toBeLessThan(
      collectionInsert.insert.mock.invocationCallOrder[0],
    );

    // The collection-count evaluator must read ownership
    // after both previous awards.
    expect(collectionOwnership.select).toHaveBeenCalledWith("achievement_id");

    expect(db.from.mock.calls.map(([table]) => table)).toEqual([
      "achievements",
      "profiles",
      "user_achievements",
      "user_achievements",
      "user_achievements",
      "user_achievements",
      "user_achievements",
      "user_achievements",
    ]);

    expect(catalogQuery.in).toHaveBeenCalledWith("trigger_type", [
      "account_age",
      "streak",
      "collection_count",
    ]);
  });

  it("loads shared definitions once for all evaluators", async () => {
    const catalogQuery = enqueueDefinitions([]);

    enqueueProfile(30);
    enqueueOwnership(ownedIds(8));

    const result = await evaluateTriggeredAchievementsForAuthenticatedUser();

    expect(result).toEqual([]);

    expect(
      db.from.mock.calls.filter(([table]) => table === "achievements"),
    ).toHaveLength(1);

    expect(catalogQuery.eq).toHaveBeenCalledWith("status", "published");

    expect(catalogQuery.eq).toHaveBeenCalledWith("is_daily", false);

    expect(catalogQuery.or).toHaveBeenCalledWith(PACK_FILTER);

    expect(catalogQuery.in).toHaveBeenCalledWith("trigger_type", [
      "account_age",
      "streak",
      "collection_count",
    ]);

    expect(mocks.getPackFilter).toHaveBeenCalledWith(USER_ID);
  });

  it("does not award achievements if the shared definition query fails", async () => {
    db.enqueue("achievements", {
      error: { message: "Database unavailable" },
    });

    const result = await evaluateTriggeredAchievementsForAuthenticatedUser();

    expect(result).toEqual([]);

    expect(db.from).toHaveBeenCalledTimes(1);

    expect(
      db.queries.every((query) => query.insert.mock.calls.length === 0),
    ).toBe(true);

    expect(mocks.getStreakData).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("continues with eligible streak and collection milestones when account age is insufficient", async () => {
    const definitions = [
      definition("account_age", "age-award", 7),
      definition("streak", "streak-award", 3),
      definition("collection_count", "collection-award", 9),
    ];

    const initialIds = ownedIds(8);

    enqueueDefinitions(definitions);

    // Account is only two days old.
    enqueueProfile(2);

    enqueueOwnership(initialIds);

    // No account-age insert should happen.
    enqueueOwnership(initialIds);
    const streakInsert = enqueueAward();

    // Now collection count sees 9 achievements.
    enqueueOwnership([...initialIds, "streak-award"]);
    const collectionInsert = enqueueAward();

    const result = await evaluateTriggeredAchievementsForAuthenticatedUser();

    expect(result.map(({ id }) => id)).toEqual([
      "streak-award",
      "collection-award",
    ]);

    expect(streakInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "streak-award",
    });

    expect(collectionInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "collection-award",
    });

    expect(
      db.queries.reduce(
        (count, query) => count + query.insert.mock.calls.length,
        0,
      ),
    ).toBe(2);
  });

  it("does not re-award achievements already owned", async () => {
    const definitions = [
      definition("account_age", "age-award", 7),
      definition("streak", "streak-award", 3),
      definition("collection_count", "collection-award", 10),
    ];

    const initialIds = [
      ...ownedIds(8),
      "age-award",
      "streak-award",
      "collection-award",
    ];

    enqueueDefinitions(definitions);
    enqueueProfile(30);

    enqueueOwnership(initialIds);
    enqueueOwnership(initialIds);
    enqueueOwnership(initialIds);

    const result = await evaluateTriggeredAchievementsForAuthenticatedUser();

    expect(result).toEqual([]);

    expect(
      db.queries.every((query) => query.insert.mock.calls.length === 0),
    ).toBe(true);

    expect(
      db.from.mock.calls.filter(([table]) => table === "achievements"),
    ).toHaveLength(1);
  });
});
