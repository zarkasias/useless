import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecordGuessGameResultInput } from "@/lib/types/games";

const mocks = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/lib/services/game-service-server", () => ({ recordAuthenticatedGameSession: mocks.record }));
import { recordGuessGameResultAction } from "@/app/actions/game-actions";
const saved = { session: { id: "session" }, stats: { games_played: 1, wins: 1, losses: 0 }, unlockedAchievements: [{ id: "existing-generic-award" }] };
const win: RecordGuessGameResultInput = { result: "win", answer: "APPLE", guesses: ["ALLEY", "APPLE"], durationSeconds: 8 };
beforeEach(() => {
  mocks.record.mockReset().mockResolvedValue(saved);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Guess result boundary", () => {
  it.each([
    { ...win },
    { ...win, result: "loss" as const, guesses: ["ALLEY", "PUPPY", "CRANE", "SLATE", "BRICK", "GHOST"] },
    { ...win, result: "abandoned" as const, guesses: ["CRANE"] },
    { ...win, result: "abandoned" as const, guesses: [] },
  ])("records a validated $result through the shared flow without fabricated score/mistakes", async (input) => {
    expect(await recordGuessGameResultAction(input)).toEqual({ success: true, ...saved });
    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({ gameType: "guess", result: input.result, moves: input.guesses.length, durationSeconds: 8, metadata: { guesses_used: input.guesses.length, word_length: 5, max_guesses: 6 } });
  });
  it("uses the existing normalization and rule functions for validation", async () => {
    await recordGuessGameResultAction({ ...win, answer: " apple ", guesses: [" alley ", "apple"] });
    expect(mocks.record).toHaveBeenCalledOnce();
  });
  it.each([
    null, {}, { ...win, result: "draw" }, { ...win, answer: null },
    { ...win, answer: "ZZZZZ" }, { ...win, answer: "PUPPY" },
    { ...win, guesses: null }, { ...win, guesses: [1] },
    { ...win, guesses: ["ABCD"] }, { ...win, guesses: ["ABC12"] },
    { ...win, guesses: ["ZZZZZ"] }, { ...win, guesses: ["ALLEY", "alley", "APPLE"] },
    { ...win, guesses: ["APPLE", "CRANE"] }, { ...win, guesses: [] },
    { ...win, guesses: ["CRANE"] }, { ...win, result: "loss" },
    { ...win, result: "abandoned" },
    { ...win, guesses: ["ALLEY", "PUPPY", "CRANE", "SLATE", "BRICK", "GHOST", "APPLE"] },
    { ...win, durationSeconds: -1 }, { ...win, durationSeconds: 0.5 },
    { ...win, durationSeconds: NaN }, { ...win, durationSeconds: Infinity },
    { ...win, durationSeconds: 2147483648 },
  ])("rejects malformed or contradictory result %# without a database write", async (input) => {
    expect(await recordGuessGameResultAction(input as unknown as RecordGuessGameResultInput)).toEqual({ success: false, error: "Invalid Guess game result" });
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("returns an uncertain-save error without retrying a potentially committed session", async () => {
    mocks.record.mockRejectedValue(new Error("Post-recording lookup failed"));
    expect(await recordGuessGameResultAction(win)).toEqual({ success: false, error: "Unable to confirm that your Guess result was saved." });
    expect(mocks.record).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalled();
  });
});
