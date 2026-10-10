import { describe, expect, it } from "vitest";

import {
  createWordDictionary,
  evaluateGuess,
  getKeyboardStatuses,
  submitGuess,
} from "@/lib/games/words/word-rules";

const dictionary = createWordDictionary([
  "APPLE",
  "ALLEY",
  "PUPPY",
  "CRANE",
  "SLATE",
  "BRICK",
  "MOUND",
  "FJORD",
  "GHOST",
]);

describe("Useless Words rule", () => {
  it("reserves exact matches before assigning misplaced letters", () => {
    const result = evaluateGuess("ALLEY", "APPLE");

    expect(result.letters.map(({ status }) => status)).toEqual([
      "correct",
      "present",
      "absent",
      "present",
      "absent",
    ]);
  });

  it("does not award more copies of a letter than the answer contains", () => {
    const result = evaluateGuess("PUPPY", "APPLE");

    expect(result.letters.map(({ status }) => status)).toEqual([
      "present",
      "absent",
      "correct",
      "absent",
      "absent",
    ]);
  });

  it("normalize input and preserve the original guesses", () => {
    const guesses: string[] = [];
    const result = submitGuess({
      guess: " crane ",
      answer: "APPLE",
      guesses,
      dictionary,
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error(result.message);
    }

    expect(result.guesses).toEqual(["CRANE"]);
    expect(result.status).toBe("playing");
    expect(guesses).toEqual([]);
  });

  it("rejects unknown word without consuming an attempt", () => {
    const guesses = ["CRANE"];

    const result = submitGuess({
      guess: "ZZZZZ",
      answer: "APPLE",
      guesses,
      dictionary,
    });

    expect(result).toMatchObject({
      success: false,
      error: "unknown-word",
    });
    expect(guesses).toEqual(["CRANE"]);
  });

  it("rejects a repeated guess", () => {
    expect(
      submitGuess({
        guess: "crane",
        answer: "APPLE",
        guesses: ["CRANE"],
        dictionary,
      }),
    ).toMatchObject({
      success: false,
      error: "already-guessed",
    });
  });

  it("allows a win on the sixth attempt", () => {
    expect(
      submitGuess({
        guess: "APPLE",
        answer: "APPLE",
        guesses: ["CRANE", "SLATE", "BRICK", "MOUND", "FJORD"],
        dictionary,
      }),
    ).toMatchObject({
      success: true,
      status: "won",
    });
  });

  it("loses after six incorrect attempts", () => {
    expect(
      submitGuess({
        guess: "GHOST",
        answer: "APPLE",
        guesses: ["CRANE", "SLATE", "BRICK", "MOUND", "FJORD"],
        dictionary,
      }),
    ).toMatchObject({
      success: true,
      status: "lost",
    });
  });

  it.each([["APPLE"], ["CRANE", "SLATE", "BRICK", "MOUND", "FJORD", "GHOST"]])(
    "rejects guesses after the game finishes: %j",
    (...guesses) => {
      expect(
        submitGuess({
          guess: "ALLEY",
          answer: "APPLE",
          guesses,
          dictionary,
        }),
      ).toMatchObject({
        success: false,
        error: "game-over",
      });
    },
  );

  it("never downgrades keyboard feedback", () => {
    const statuses = getKeyboardStatuses([
      evaluateGuess("APPLE", "APPLE"),
      evaluateGuess("ALLEY", "APPLE"),
    ]);

    expect(statuses.L).toBe("correct");
    expect(statuses.E).toBe("correct");
    expect(statuses.Y).toBe("absent");
  });

  it("rejects malformed dictionary entries", () => {
    expect(() => createWordDictionary(["FOUR"])).toThrow();
  });
});
