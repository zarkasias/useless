import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type {
  GameSession,
  GameTriggerConfig,
  UserGameStats,
} from "@/lib/types/games";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { evaluateGameAchievements } from "@/lib/services/triggers/game-trigger";

let db: ReturnType<typeof database>;
let session: GameSession;
let stats: UserGameStats;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  vi.spyOn(console, "error").mockImplementation(() => {});

  session = {
    id: "session-1",
    user_id: "user-1",
    game_type: "solitaire",
    result: "win",
    score: 100,
    moves: 40,
    mistakes: 2,
    duration_seconds: 120,
    metadata: { auto_finished: true },
    started_at: "2026-10-07T12:00:00.000Z",
    completed_at: "2026-10-07T12:02:00.000Z",
  };

  stats = {
    user_id: "user-1",
    game_type: "solitaire",
    games_played: 10,
    games_completed: 8,
    wins: 6,
    losses: 2,
    abandoned: 2,
    best_score: 200,
    current_win_streak: 3,
    best_win_streak: 4,
    total_score: 800,
    total_duration_seconds: 1200,
    last_played_at: session.completed_at,
    updated_at: "2026-10-07T12:02:00.000Z",
  };
});

function candidate(
  config: Partial<GameTriggerConfig> = {},
  triggerType = "game_session",
  id = "award-1",
) {
  return {
    id,
    title: "Useless victory",
    trigger_type: triggerType,
    trigger_config: {
      game: "solitaire",
      metric: "score",
      operator: ">=",
      value: 100,
      ...config,
    },
    status: "published",
  };
}

function run() {
  return evaluateGameAchievements({
    userId: "user-1",
    session,
    stats,
  });
}

function enqueueCandidates(
  achievements: unknown[],
  existing: Array<{ achievement_id: string }> | null = [],
) {
  const catalog = db.enqueue("achievements", {
    data: achievements,
  });
  db.enqueue("user_achievements", { data: existing });
  return catalog;
}

function expectAllQueriesConsumed() {
  expect(db.from).toHaveBeenCalledTimes(db.queries.length);
}

describe("game achievement eligibility", () => {
  it("awards a qualifying achievement using published game triggers", async () => {
    const award = candidate();
    const catalog = enqueueCandidates([award]);
    const insert = db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);

    expect(catalog.in).toHaveBeenCalledWith("trigger_type", [
      "game_session",
      "game_stat",
    ]);
    expect(catalog.eq).toHaveBeenCalledWith("status", "published");
    expect(db.queries[1].eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(insert.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      achievement_id: award.id,
    });
    expectAllQueriesConsumed();
  });

  it.each([
    { name: "another game", config: { game: "memory" as const } },
    { name: "another result", config: { result: "loss" as const } },
    { name: "an unmet threshold", config: { value: 101 } },
  ])("skips $name", async ({ config }) => {
    enqueueCandidates([candidate(config)]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it("supports achievements for all games", async () => {
    const award = candidate({ game: "all", result: "win" });
    enqueueCandidates([award]);
    db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);
  });

  it("skips awards the user already owns", async () => {
    enqueueCandidates([candidate()], [{ achievement_id: "award-1" }]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it("skips a missing configuration", async () => {
    enqueueCandidates([{ ...candidate(), trigger_config: null }]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it("handles null ownership data as an empty collection", async () => {
    const award = candidate();
    enqueueCandidates([award], null);
    db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);
  });

  it.each([
    { trigger: "game_session", metric: "wins" as const },
    { trigger: "game_stat", metric: "moves" as const },
  ])(
    "skips unsupported $trigger metric $metric",
    async ({ trigger, metric }) => {
      enqueueCandidates([candidate({ metric }, trigger)]);

      await expect(run()).resolves.toEqual([]);
      expectAllQueriesConsumed();
    },
  );
});

describe("game metric comparisons", () => {
  it.each([
    { operator: "=" as const, value: 100, qualifies: true },
    { operator: "=" as const, value: 99, qualifies: false },
    { operator: ">=" as const, value: 100, qualifies: true },
    { operator: ">=" as const, value: 101, qualifies: false },
    { operator: "<=" as const, value: 100, qualifies: true },
    { operator: "<=" as const, value: 99, qualifies: false },
    { operator: ">" as const, value: 99, qualifies: true },
    { operator: ">" as const, value: 100, qualifies: false },
    { operator: "<" as const, value: 101, qualifies: true },
    { operator: "<" as const, value: 100, qualifies: false },
  ])(
    "score 100 $operator $value qualifies=$qualifies",
    async ({ operator, value, qualifies }) => {
      const award = candidate({ operator, value });
      enqueueCandidates([award]);

      if (qualifies) {
        db.enqueue("user_achievements", {});
      }

      await expect(run()).resolves.toEqual(qualifies ? [award] : []);
      expectAllQueriesConsumed();
    },
  );

  it.each([
    { metric: "score" as const, value: 100 },
    { metric: "moves" as const, value: 40 },
    { metric: "mistakes" as const, value: 2 },
    { metric: "duration_seconds" as const, value: 120 },
    { metric: "auto_finished" as const, value: true },
  ])("reads session metric $metric", async ({ metric, value }) => {
    const award = candidate({ metric, operator: "=", value });
    enqueueCandidates([award]);
    db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);
  });

  it.each([
    { metric: "games_played" as const, value: 10 },
    { metric: "games_completed" as const, value: 8 },
    { metric: "wins" as const, value: 6 },
    { metric: "losses" as const, value: 2 },
    { metric: "abandoned" as const, value: 2 },
    { metric: "best_score" as const, value: 200 },
    { metric: "current_win_streak" as const, value: 3 },
    { metric: "best_win_streak" as const, value: 4 },
    { metric: "total_score" as const, value: 800 },
    { metric: "total_duration_seconds" as const, value: 1200 },
  ])("reads aggregate metric $metric", async ({ metric, value }) => {
    const award = candidate({ metric, operator: "=", value }, "game_stat");
    enqueueCandidates([award]);
    db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);
  });

  it("does not treat a null score as zero", async () => {
    session.score = null;
    enqueueCandidates([candidate({ operator: "=", value: 0 })]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it("does not treat a null best score as zero", async () => {
    stats.best_score = null;
    enqueueCandidates([
      candidate({ metric: "best_score", operator: "=", value: 0 }, "game_stat"),
    ]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it.each([
    { label: "missing", metadata: {} },
    { label: "string", metadata: { auto_finished: "true" } },
  ])("skips $label auto-finish metadata", async ({ metadata }) => {
    session.metadata = metadata;
    enqueueCandidates([
      candidate({ metric: "auto_finished", operator: "=", value: true }),
    ]);

    await expect(run()).resolves.toEqual([]);
    expectAllQueriesConsumed();
  });

  it("supports false auto-finish values", async () => {
    session.metadata = { auto_finished: false };
    const award = candidate({
      metric: "auto_finished",
      operator: "=",
      value: false,
    });
    enqueueCandidates([award]);
    db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([award]);
  });

  it.each([
    { operator: "=" as const, value: false },
    { operator: ">=" as const, value: true },
    { operator: "=" as const, value: 1 },
  ])(
    "rejects incompatible boolean comparison $operator $value",
    async ({ operator, value }) => {
      enqueueCandidates([
        candidate({ metric: "auto_finished", operator, value }),
      ]);

      await expect(run()).resolves.toEqual([]);
      expectAllQueriesConsumed();
    },
  );
});

describe("game achievement database failures", () => {
  it.each([
    { label: "null", data: null },
    { label: "empty", data: [] },
  ])("returns no awards for a $label catalog", async ({ data }) => {
    db.enqueue("achievements", { data });

    await expect(run()).resolves.toEqual([]);
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("throws when the catalog cannot be loaded", async () => {
    db.enqueue("achievements", {
      error: { message: "Catalog unavailable" },
    });

    await expect(run()).rejects.toThrow("Failed to evaluate game achievements");
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("throws before awarding when ownership cannot be loaded", async () => {
    db.enqueue("achievements", { data: [candidate()] });
    db.enqueue("user_achievements", {
      error: { message: "Ownership unavailable" },
    });

    await expect(run()).rejects.toThrow("Failed to evaluate game achievements");
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("returns only successful awards and continues after an insert error", async () => {
    const first = candidate({}, "game_session", "first");
    const second = candidate({}, "game_session", "second");

    enqueueCandidates([first, second]);
    const error = { message: "Insert failed" };
    db.enqueue("user_achievements", { error });
    const successfulInsert = db.enqueue("user_achievements", {});

    await expect(run()).resolves.toEqual([second]);

    expect(successfulInsert.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      achievement_id: "second",
    });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to award game achievement first:",
      error,
    );
    expectAllQueriesConsumed();
  });
});


it("continues evaluating existing all-game achievements for Guess without adding Guess-specific rules", async () => {
  session = { ...session, game_type: "guess", result: "loss", score: null, metadata: { guesses_used: 6 } };
  stats = { ...stats, game_type: "guess", losses: 1 };
  const generic = candidate({ game: "all", metric: "losses", operator: ">=", value: 1 }, "game_stat", "existing-generic");
  const unrelated = candidate({ game: "memory", metric: "losses", operator: ">=", value: 1 }, "game_stat", "memory-only");
  enqueueCandidates([generic, unrelated]);
  const award = db.enqueue("user_achievements", {});
  expect(await run()).toEqual([generic]);
  expect(award.insert).toHaveBeenCalledWith({ user_id: "user-1", achievement_id: "existing-generic" });
  expectAllQueriesConsumed();
});
