import { describe, expect, it } from "vitest";
import {
  createWordDictionary,
  evaluateGuess,
  getKeyboardStatuses,
  getWordGameStatus,
  isFiveLetterWord,
  normalizeWord,
  submitGuess,
} from "@/lib/games/words/word-rules";

const dictionary = createWordDictionary(["APPLE", "ALLEY", "PUPPY", "CRANE"]);

describe("existing word-rule boundary characterization", () => {
  it("normalizes and deduplicates dictionary entries", () => {
    expect(normalizeWord(" apple ")).toBe("APPLE");
    expect(createWordDictionary(["apple", " APPLE "])).toEqual(new Set(["APPLE"]));
    expect(isFiveLetterWord("APPLE")).toBe(true);
    for (const word of ["apple", "FOUR", "ABC12", "CAFÉE", "ABCDEF"]) {
      expect(isFiveLetterWord(word)).toBe(false);
    }
  });

  it.each([
    ["", "invalid-length"], ["FOUR", "invalid-length"],
    ["LONGER", "invalid-length"], ["ABC12", "invalid-characters"],
    ["ZZZZZ", "unknown-word"], ["crane", "already-guessed"],
  ])("rejects %s without mutating existing guesses", (guess, error) => {
    const guesses = Object.freeze(["CRANE"]);
    expect(submitGuess({ guess, answer: "APPLE", guesses, dictionary }))
      .toMatchObject({ success: false, error, message: expect.any(String) });
    expect(guesses).toEqual(["CRANE"]);
  });

  it("rejects invalid answers before accepting guesses", () => {
    for (const answer of ["FOUR", "ZZZZZ"]) {
      expect(() => submitGuess({ guess: "APPLE", answer, guesses: [], dictionary })).toThrow();
    }
    expect(() => evaluateGuess("AB12C", "APPLE")).toThrow();
    expect(() => evaluateGuess("APPLE", "FOUR")).toThrow();
  });

  it("prioritizes a final-turn win over the guess limit", () => {
    expect(getWordGameStatus(["ALLEY", "PUPPY", "CRANE", "BRICK", "GHOST", "apple"], "APPLE")).toBe("won");
    expect(getWordGameStatus(["ALLEY"], "APPLE")).toBe("playing");
  });

  it("upgrades keyboard statuses while never downgrading an exact match", () => {
    const first = evaluateGuess("PUPPY", "APPLE");
    const second = evaluateGuess("ALLEY", "APPLE");
    const final = evaluateGuess("APPLE", "APPLE");
    expect(getKeyboardStatuses([first]).P).toBe("correct");
    expect(getKeyboardStatuses([first, second]).L).toBe("present");
    expect(getKeyboardStatuses([first, second, final]).L).toBe("correct");
    expect(getKeyboardStatuses([final, first, second]).P).toBe("correct");
  });
});
