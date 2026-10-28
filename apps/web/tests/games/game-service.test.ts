import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type { GameSession, UserGameStats } from "@/lib/types/games";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  evaluate: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: mocks.from,
    rpc: mocks.rpc,
  }),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/triggers/game-trigger", () => ({
  evaluateGameAchievements: mocks.evaluate,
}));

import {
  getAuthenticatedGameStats,
  getAuthenticatedMemoryAchievements,
  recordAuthenticatedGameSession,
} from "@/lib/services/game-service-server";

const NOW = "2026-10-07T12:00:00.000Z";
let db: ReturnType<typeof database>;

function session(): GameSession {
  return {
    id: "session-1",
    user_id: "user-1",
    game_type: "memory",
    result: "win",
    score: 100,
    moves: 12,
    mistakes: 2,
    duration_seconds: 60,
    metadata: { pairs: 6 },
    started_at: NOW,
    completed_at: NOW,
  };
}

function stats(): UserGameStats {
  return {
    user_id: "user-1",
    game_type: "memory",
    games_played: 1,
    games_completed: 1,
    wins: 1,
    losses: 0,
    abandoned: 0,
    best_score: 100,
    total_score: 100,
    total_duration_seconds: 60,
    current_win_streak: 1,
    best_win_streak: 1,
    last_played_at: NOW,
    updated_at: NOW,
  };
}

function memoryAchievement(index: number) {
  return {
    id: `award-${index}`,
    title: `Achievement ${index}`,
    emoji: "🏆",
    icon_path: null,
    type: "common",
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.rpc.mockReset();
  mocks.rpc.mockResolvedValue({ data: "session-1", error: null });
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.evaluate.mockReset();
  mocks.evaluate.mockResolvedValue([]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("game service authentication", () => {
  it.each([
    {
      name: "Memory achievements",
      run: () => getAuthenticatedMemoryAchievements(),
    },
    {
      name: "game stats",
      run: () => getAuthenticatedGameStats("memory"),
    },
    {
      name: "recording",
      run: () =>
        recordAuthenticatedGameSession({
          gameType: "memory",
          result: "win",
        }),
    },
  ])("requires authentication for $name", async ({ run }) => {
    mocks.getUser.mockResolvedValue(null);

    await expect(run()).rejects.toThrow("User must be authenticated");
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });
});

describe("Memory achievement selection", () => {
  it("maps object and array joins and selects six owned achievements", async () => {
    const achievements = Array.from({ length: 8 }, (_, index) =>
      memoryAchievement(index),
    );
    const rows = achievements.map((achievement, index) => ({
      achievements: index % 2 ? [achievement] : achievement,
    }));

    const query = db.enqueue("user_achievements", { data: rows });

    const result = await getAuthenticatedMemoryAchievements();

    expect(result).toHaveLength(6);
    expect(new Set(result.map((item) => item.id)).size).toBe(6);

    for (const selected of result) {
      expect(achievements).toContainEqual(selected);
    }

    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining("achievements!inner"),
    );
  });

  it("skips missing joins and honors a custom limit", async () => {
    const first = memoryAchievement(1);
    const second = memoryAchievement(2);

    db.enqueue("user_achievements", {
      data: [
        { achievements: null },
        { achievements: [] },
        {},
        { achievements: first },
        { achievements: [second] },
      ],
    });

    const result = await getAuthenticatedMemoryAchievements(2);

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([first, second]));
  });

  it("returns no playable set when too few valid achievements exist", async () => {
    db.enqueue("user_achievements", {
      data: [{ achievements: memoryAchievement(1) }],
    });

    await expect(getAuthenticatedMemoryAchievements()).resolves.toEqual([]);
  });

  it.each([
    { label: "null", data: null },
    { label: "empty", data: [] },
  ])("handles $label ownership data", async ({ data }) => {
    db.enqueue("user_achievements", { data });

    await expect(getAuthenticatedMemoryAchievements()).resolves.toEqual([]);
  });

  it("throws when the ownership lookup fails", async () => {
    db.enqueue("user_achievements", {
      error: { message: "Read failed" },
    });

    await expect(getAuthenticatedMemoryAchievements()).rejects.toThrow(
      "Failed to load Memory achievements",
    );
  });
});

describe("recording game results", () => {
  it("records all supplied metrics and returns updated data and awards", async () => {
    const savedSession = session();
    const savedStats = stats();
    const awards = [{ id: "unlocked-1" }];

    const sessionQuery = db.enqueue("game_sessions", {
      data: savedSession,
    });
    const statsQuery = db.enqueue("user_game_stats", {
      data: savedStats,
    });
    mocks.evaluate.mockResolvedValue(awards);

    await expect(
      recordAuthenticatedGameSession({
        gameType: "memory",
        result: "win",
        score: 100,
        moves: 12,
        mistakes: 2,
        durationSeconds: 60,
        metadata: { pairs: 6 },
      }),
    ).resolves.toEqual({
      session: savedSession,
      stats: savedStats,
      unlockedAchievements: awards,
    });

    expect(mocks.rpc).toHaveBeenCalledWith("record_game_result", {
      p_user_id: "user-1",
      p_game_type: "memory",
      p_result: "win",
      p_score: 100,
      p_moves: 12,
      p_mistakes: 2,
      p_duration_seconds: 60,
      p_metadata: { pairs: 6 },
    });
    expect(sessionQuery.eq).toHaveBeenCalledWith("id", "session-1");
    expect(statsQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(statsQuery.eq).toHaveBeenCalledWith("game_type", "memory");
    expect(mocks.evaluate).toHaveBeenCalledWith({
      userId: "user-1",
      session: savedSession,
      stats: savedStats,
    });
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("uses null optional metrics and empty metadata when omitted", async () => {
    db.enqueue("game_sessions", { data: session() });
    db.enqueue("user_game_stats", { data: stats() });

    await recordAuthenticatedGameSession({
      gameType: "memory",
      result: "loss",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("record_game_result", {
      p_user_id: "user-1",
      p_game_type: "memory",
      p_result: "loss",
      p_score: null,
      p_moves: null,
      p_mistakes: null,
      p_duration_seconds: null,
      p_metadata: {},
    });
  });

  it("does not load results or evaluate awards after an RPC failure", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "RPC failed" },
    });

    await expect(
      recordAuthenticatedGameSession({
        gameType: "memory",
        result: "win",
      }),
    ).rejects.toThrow("Failed to record game result");

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it.each([
    {
      failure: "session",
      message: "Failed to load recorded game session",
    },
    {
      failure: "stats",
      message: "Failed to load updated game stats",
    },
  ])(
    "reports a post-recording $failure lookup failure",
    async ({ failure, message }) => {
      db.enqueue(
        "game_sessions",
        failure === "session"
          ? { error: { message: "Session unavailable" } }
          : { data: session() },
      );
      db.enqueue(
        "user_game_stats",
        failure === "stats"
          ? { error: { message: "Stats unavailable" } }
          : { data: stats() },
      );

      await expect(
        recordAuthenticatedGameSession({
          gameType: "memory",
          result: "win",
        }),
      ).rejects.toThrow(message);

      expect(mocks.rpc).toHaveBeenCalledOnce();
      expect(mocks.evaluate).not.toHaveBeenCalled();
    },
  );

  it("propagates award-evaluation failures without recording twice", async () => {
    db.enqueue("game_sessions", { data: session() });
    db.enqueue("user_game_stats", { data: stats() });
    mocks.evaluate.mockRejectedValue(new Error("Awards unavailable"));

    await expect(
      recordAuthenticatedGameSession({
        gameType: "memory",
        result: "win",
      }),
    ).rejects.toThrow("Awards unavailable");

    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
});

describe("game stats lookup", () => {
  it("returns stats scoped to the authenticated user and requested game", async () => {
    const saved = stats();
    const query = db.enqueue("user_game_stats", { data: saved });

    await expect(getAuthenticatedGameStats("memory")).resolves.toEqual(saved);

    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("game_type", "memory");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
  });

  it("returns null when the user has not played the game", async () => {
    db.enqueue("user_game_stats", { data: null });

    await expect(getAuthenticatedGameStats("memory")).resolves.toBeNull();
  });

  it("throws when stats cannot be loaded", async () => {
    db.enqueue("user_game_stats", {
      error: { message: "Read failed" },
    });

    await expect(getAuthenticatedGameStats("memory")).rejects.toThrow(
      "Failed to load game stats",
    );
  });
});


describe("Guess uses the existing session/statistics/achievement flow", () => {
  it.each(["win", "loss", "abandoned"] as const)("forwards Guess %s with nullable unsupported metrics and returns stored counters", async (result) => {
    const savedSession = { ...session(), game_type: "guess" as const, result, score: null, mistakes: null, moves: 3, metadata: { guesses_used: 3 } };
    const savedStats = { ...stats(), game_type: "guess" as const, best_score: null, total_score: 0, wins: result === "win" ? 1 : 0, losses: result === "loss" ? 1 : 0, abandoned: result === "abandoned" ? 1 : 0 };
    const sessionQuery = db.enqueue("game_sessions", { data: savedSession });
    const statsQuery = db.enqueue("user_game_stats", { data: savedStats });
    const resultData = await recordAuthenticatedGameSession({ gameType: "guess", result, moves: 3, durationSeconds: 12, metadata: { guesses_used: 3 } });
    expect(resultData.stats).toEqual(savedStats);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("record_game_result", { p_user_id: "user-1", p_game_type: "guess", p_result: result, p_score: null, p_moves: 3, p_mistakes: null, p_duration_seconds: 12, p_metadata: { guesses_used: 3 } });
    expect(sessionQuery.eq).toHaveBeenCalledWith("id", "session-1");
    expect(statsQuery.eq).toHaveBeenCalledWith("game_type", "guess");
    expect(mocks.evaluate).toHaveBeenCalledWith({ userId: "user-1", session: savedSession, stats: savedStats });
  });
  it("loads Guess lifetime statistics for the authenticated user", async () => {
    const savedStats = { ...stats(), game_type: "guess" as const };
    const query = db.enqueue("user_game_stats", { data: savedStats });
    expect(await getAuthenticatedGameStats("guess")).toEqual(savedStats);
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("game_type", "guess");
  });
});
