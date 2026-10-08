import { beforeEach, describe, expect, it, vi } from "vitest";

import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getPackFilter: vi.fn(),
  isFreeLimitError: vi.fn(),
}));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
  isFreeLimitError: mocks.isFreeLimitError,
}));

vi.mock("@/lib/services/achievement-access-service-server", () => ({
  getAchievementPackFilter: mocks.getPackFilter,
}));

import { evaluateStreakAchievements } from "@/lib/services/triggers/streak-trigger";
import { evaluateAccountAgeAchievements } from "@/lib/services/triggers/account-age-trigger";
import { evaluateCollectionCountAchievements } from "@/lib/services/triggers/collection-count-trigger";

const USER_ID = "user-1";
const NOW = new Date("2026-10-07T12:00:00.000Z");
const DAY_MS = 86_400_000;
const AWARDED_AT = NOW.toISOString();
const PACK_FILTER = "pack_id.is.null,pack_id.in.(pack-1)";

let db: ReturnType<typeof database>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);

  db = database();

  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getPackFilter.mockReset();
  mocks.getPackFilter.mockResolvedValue(PACK_FILTER);
  mocks.isFreeLimitError.mockReset();
  mocks.isFreeLimitError.mockReturnValue(false);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

type Trigger = "streak" | "account_age" | "collection_count";

function achievement(trigger: Trigger, id: string, threshold: unknown = 3) {
  return {
    id,
    title: `Achievement ${id}`,
    description: "A milestone",
    type: "common",
    emoji: "🏆",
    icon_path: null,
    created_at: "2026-01-01T00:00:00.000Z",
    is_daily: false,
    is_secret: false,
    status: "published",
    trigger_type: trigger,
    trigger_config: {
      [trigger === "collection_count" ? "count" : "days"]: threshold,
    },
  };
}

const cases = [
  {
    trigger: "streak" as const,
    run: () =>
      evaluateStreakAchievements({
        userId: USER_ID,
        currentStreak: 3,
      }),
  },
  {
    trigger: "account_age" as const,
    run: () => evaluateAccountAgeAchievements({ userId: USER_ID }),
  },
  {
    trigger: "collection_count" as const,
    run: () => evaluateCollectionCountAchievements({ userId: USER_ID }),
  },
];

function enqueueReads(
  trigger: Trigger,
  candidates: unknown[] | null,
  ownedIds: string[] = ["owned-1", "owned-2", "owned-3"],
  failure?: "candidates" | "owned",
) {
  const ownedResult = {
    data: ownedIds.map((achievement_id) => ({ achievement_id })),
    error: failure === "owned" ? { message: "Read failed" } : null,
  };

  if (trigger === "account_age") {
    db.enqueue("profiles", {
      data: {
        created_at: new Date(NOW.getTime() - 3 * DAY_MS).toISOString(),
      },
    });
  }

  if (trigger === "collection_count") {
    db.enqueue("user_achievements", ownedResult);
  }

  const candidateQuery = db.enqueue("achievements", {
    data: candidates,
    error: failure === "candidates" ? { message: "Read failed" } : null,
  });

  if (
    trigger !== "collection_count" &&
    failure !== "candidates" &&
    candidates &&
    candidates.length > 0
  ) {
    db.enqueue("user_achievements", ownedResult);
  }

  return candidateQuery;
}

describe.each(cases)("$trigger achievement awards", ({ trigger, run }) => {
  it("awards at the exact threshold and returns the saved timestamp", async () => {
    const candidate = achievement(trigger, "eligible");
    const query = enqueueReads(trigger, [candidate]);
    const insert = db.enqueue("user_achievements", {
      data: { created_at: AWARDED_AT },
    });

    const result = await run();

    expect(result).toEqual([
      {
        ...candidate,
        user_id: USER_ID,
        created_at: AWARDED_AT,
      },
    ]);
    expect(insert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "eligible",
    });
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.eq).toHaveBeenCalledWith("trigger_type", trigger);
    expect(query.eq).toHaveBeenCalledWith("is_daily", false);
    expect(query.or).toHaveBeenCalledWith(PACK_FILTER);
    expect(mocks.getPackFilter).toHaveBeenCalledWith(USER_ID);
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it("does not award an achievement above the current threshold", async () => {
    enqueueReads(trigger, [achievement(trigger, "later", 4)]);

    expect(await run()).toEqual([]);
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it("does not award an already-owned achievement again", async () => {
    enqueueReads(trigger, [achievement(trigger, "owned-1")]);

    expect(await run()).toEqual([]);
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it.each([null, 0, -1, "3"])(
    "skips an invalid threshold: %j",
    async (threshold) => {
      enqueueReads(trigger, [achievement(trigger, "invalid", threshold)]);

      expect(await run()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledTimes(db.queries.length);
    },
  );

  it("skips a missing trigger configuration", async () => {
    enqueueReads(trigger, [
      {
        ...achievement(trigger, "invalid"),
        trigger_config: null,
      },
    ]);

    expect(await run()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it.each([null, []])(
    "returns no awards when no candidates are returned: %j",
    async (candidates) => {
      enqueueReads(trigger, candidates);

      expect(await run()).toEqual([]);
      expect(db.from).toHaveBeenCalledTimes(db.queries.length);
    },
  );

  it("does not insert awards after a candidate read failure", async () => {
    enqueueReads(
      trigger,
      [achievement(trigger, "eligible")],
      undefined,
      "candidates",
    );

    expect(await run()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it("does not insert awards after an ownership read failure", async () => {
    if (trigger === "collection_count") {
      db.enqueue("user_achievements", {
        error: { message: "Ownership read failed" },
      });
    } else {
      enqueueReads(
        trigger,
        [achievement(trigger, "eligible")],
        undefined,
        "owned",
      );
    }

    expect(await run()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });

  it("continues to later awards after an ordinary insert failure", async () => {
    enqueueReads(trigger, [
      achievement(trigger, "first"),
      achievement(trigger, "second"),
    ]);

    const error = { code: "XX000", message: "Insert failed" };

    db.enqueue("user_achievements", { error });
    const secondInsert = db.enqueue("user_achievements", {
      data: { created_at: AWARDED_AT },
    });

    const result = await run();

    expect(result.map(({ id }) => id)).toEqual(["second"]);
    expect(mocks.isFreeLimitError).toHaveBeenCalledWith(error);
    expect(secondInsert.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      achievement_id: "second",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("stops awarding when the free-account limit is reached", async () => {
    enqueueReads(trigger, [
      achievement(trigger, "first"),
      achievement(trigger, "blocked"),
      achievement(trigger, "never-attempted"),
    ]);

    db.enqueue("user_achievements", {
      data: { created_at: AWARDED_AT },
    });

    const error = {
      code: "23514",
      message: "Free achievement limit reached",
    };

    db.enqueue("user_achievements", { error });
    mocks.isFreeLimitError.mockReturnValue(true);

    const result = await run();

    expect(result.map(({ id }) => id)).toEqual(["first"]);
    expect(mocks.isFreeLimitError).toHaveBeenCalledWith(error);
    expect(db.from).toHaveBeenCalledTimes(db.queries.length);
  });
});

describe("trigger-specific boundaries", () => {
  it.each([0, -1])(
    "does not query achievements for a nonpositive streak: %s",
    async (currentStreak) => {
      expect(
        await evaluateStreakAchievements({
          userId: USER_ID,
          currentStreak,
        }),
      ).toEqual([]);

      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.getPackFilter).not.toHaveBeenCalled();
    },
  );

  it("requires complete elapsed days for account-age awards", async () => {
    db.enqueue("profiles", {
      data: {
        created_at: new Date(NOW.getTime() - 3 * DAY_MS + 1).toISOString(),
      },
    });
    db.enqueue("achievements", {
      data: [achievement("account_age", "three-days", 3)],
    });
    db.enqueue("user_achievements", { data: [] });

    expect(await evaluateAccountAgeAchievements({ userId: USER_ID })).toEqual(
      [],
    );
    expect(db.from).toHaveBeenCalledTimes(3);
  });

  it.each([
    { data: null, error: { message: "Profile read failed" } },
    { data: null, error: null },
    { data: { created_at: null }, error: null },
  ])("stops when profile age cannot be loaded: %j", async (result) => {
    db.enqueue("profiles", result);

    expect(await evaluateAccountAgeAchievements({ userId: USER_ID })).toEqual(
      [],
    );
    expect(mocks.getPackFilter).not.toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("counts distinct owned achievements rather than duplicate rows", async () => {
    enqueueReads(
      "collection_count",
      [achievement("collection_count", "three-owned", 3)],
      ["owned-1", "owned-1", "owned-2"],
    );

    expect(
      await evaluateCollectionCountAchievements({ userId: USER_ID }),
    ).toEqual([]);
    expect(db.from).toHaveBeenCalledTimes(2);
  });
});
