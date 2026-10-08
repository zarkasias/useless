import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  record: vi.fn(),
}));

vi.mock("@/lib/services/game-service-server", () => ({
  recordAuthenticatedGameSession: mocks.record,
}));

import {
  recordKlondikeGameResultAction,
  recordMemoryGameResultAction,
  recordSpiderGameResultAction,
} from "@/app/actions/game-actions";

const saved = {
  session: { id: "session-1" },
  stats: { wins: 1 },
  unlockedAchievements: [{ id: "award-1" }],
};

const memoryInput = {
  result: "win" as const,
  moves: 12,
  mistakes: 2,
  durationSeconds: 60,
  achievementIds: ["award-1", "award-2"],
  pairs: 6,
  score: 650,
};

const klondikeInput = {
  result: "win" as const,
  moves: 90,
  durationSeconds: 200,
  score: 950,
  autoFinished: true,
};

const spiderInput = {
  result: "win" as const,
  moves: 100,
  durationSeconds: 300,
  difficulty: 2 as const,
  completedRuns: 8,
};

beforeEach(() => {
  mocks.record.mockReset();
  mocks.record.mockResolvedValue(saved);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("successful game result actions", () => {
  it("records Memory metrics and achievement IDs", async () => {
    await expect(recordMemoryGameResultAction(memoryInput)).resolves.toEqual({
      success: true,
      ...saved,
    });

    expect(mocks.record).toHaveBeenCalledWith({
      gameType: "memory",
      result: "win",
      score: 650,
      moves: 12,
      mistakes: 2,
      durationSeconds: 60,
      metadata: {
        pairs: 6,
        achievement_ids: ["award-1", "award-2"],
      },
    });
  });

  it("records Klondike metrics and auto-finish metadata", async () => {
    await expect(
      recordKlondikeGameResultAction(klondikeInput),
    ).resolves.toEqual({ success: true, ...saved });

    expect(mocks.record).toHaveBeenCalledWith({
      gameType: "solitaire",
      result: "win",
      score: 950,
      moves: 90,
      mistakes: 0,
      durationSeconds: 200,
      metadata: {
        variant: "klondike",
        auto_finished: true,
      },
    });
  });

  it("calculates Spider score on the server", async () => {
    await expect(recordSpiderGameResultAction(spiderInput)).resolves.toEqual({
      success: true,
      ...saved,
    });

    expect(mocks.record).toHaveBeenCalledWith({
      gameType: "spider",
      result: "win",
      score: 1200,
      moves: 100,
      durationSeconds: 300,
      metadata: {
        variant: "spider",
        suits: 2,
        completed_runs: 8,
      },
    });
  });

  it.each(["loss", "abandoned"] as const)(
    "records zero score for a Spider %s",
    async (result) => {
      await recordSpiderGameResultAction({
        ...spiderInput,
        result,
        completedRuns: 3,
      });

      expect(mocks.record).toHaveBeenCalledWith(
        expect.objectContaining({
          result,
          score: 0,
          metadata: {
            variant: "spider",
            suits: 2,
            completed_runs: 3,
          },
        }),
      );
    },
  );
});

describe("Memory result validation", () => {
  it.each([
    { label: "negative moves", change: { moves: -1 } },
    { label: "negative mistakes", change: { mistakes: -1 } },
    { label: "negative duration", change: { durationSeconds: -1 } },
    { label: "zero pairs", change: { pairs: 0 } },
    { label: "negative pairs", change: { pairs: -1 } },
  ])("rejects $label without recording", async ({ change }) => {
    await expect(
      recordMemoryGameResultAction({ ...memoryInput, ...change }),
    ).resolves.toEqual({
      success: false,
      error: "Invalid game result",
    });

    expect(mocks.record).not.toHaveBeenCalled();
  });
});

describe("Klondike result validation", () => {
  it.each([
    { label: "negative moves", change: { moves: -1 } },
    { label: "negative duration", change: { durationSeconds: -1 } },
    { label: "negative score", change: { score: -1 } },
  ])("rejects $label without recording", async ({ change }) => {
    await expect(
      recordKlondikeGameResultAction({ ...klondikeInput, ...change }),
    ).resolves.toEqual({
      success: false,
      error: "Invalid game result",
    });

    expect(mocks.record).not.toHaveBeenCalled();
  });
});

describe("Spider result validation", () => {
  const invalidInputs = [
    { label: "null input", input: null },
    { label: "unknown result", input: { ...spiderInput, result: "draw" } },
    { label: "negative moves", input: { ...spiderInput, moves: -1 } },
    { label: "fractional moves", input: { ...spiderInput, moves: 1.5 } },
    { label: "NaN moves", input: { ...spiderInput, moves: NaN } },
    { label: "infinite moves", input: { ...spiderInput, moves: Infinity } },
    {
      label: "unsafe moves",
      input: { ...spiderInput, moves: Number.MAX_SAFE_INTEGER + 1 },
    },
    {
      label: "negative duration",
      input: { ...spiderInput, durationSeconds: -1 },
    },
    {
      label: "fractional duration",
      input: { ...spiderInput, durationSeconds: 1.5 },
    },
    {
      label: "infinite duration",
      input: { ...spiderInput, durationSeconds: Infinity },
    },
    {
      label: "invalid difficulty",
      input: { ...spiderInput, difficulty: 3 },
    },
    {
      label: "negative runs",
      input: { ...spiderInput, completedRuns: -1 },
    },
    {
      label: "too many runs",
      input: { ...spiderInput, completedRuns: 9 },
    },
    {
      label: "fractional runs",
      input: { ...spiderInput, completedRuns: 1.5 },
    },
    {
      label: "incomplete win",
      input: { ...spiderInput, completedRuns: 7 },
    },
    {
      label: "completed loss",
      input: { ...spiderInput, result: "loss" },
    },
  ];

  it.each(invalidInputs)(
    "rejects $label without recording",
    async ({ input }) => {
      // Intentionally bypass static types to test runtime input rejection.
      await expect(
        recordSpiderGameResultAction(
          input as unknown as Parameters<
            typeof recordSpiderGameResultAction
          >[0],
        ),
      ).resolves.toEqual({
        success: false,
        error: "Invalid Spider game result",
      });

      expect(mocks.record).not.toHaveBeenCalled();
    },
  );
});

describe("result persistence failures", () => {
  it.each([
    {
      game: "Memory",
      run: () => recordMemoryGameResultAction(memoryInput),
      message: "Unable to save game result",
    },
    {
      game: "Klondike",
      run: () => recordKlondikeGameResultAction(klondikeInput),
      message: "Unable to save game result",
    },
    {
      game: "Spider",
      run: () => recordSpiderGameResultAction(spiderInput),
      message: "Unable to save Spider game result",
    },
  ])("returns a failure response for $game", async ({ run, message }) => {
    mocks.record.mockRejectedValue(new Error("Database unavailable"));

    await expect(run()).resolves.toEqual({
      success: false,
      error: message,
    });
    expect(mocks.record).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalled();
  });
});
