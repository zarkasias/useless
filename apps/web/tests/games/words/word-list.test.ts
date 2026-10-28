import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { acceptedWords, answerWords, chooseAnswer, wordDictionary } from "@/lib/games/words/word-list";

describe("approved local dictionary", () => {
  it("contains the accepted counts and only unique five-letter uppercase entries", () => {
    expect(acceptedWords).toHaveLength(5063);
    expect(new Set(acceptedWords).size).toBe(5063);
    expect(answerWords).toHaveLength(823);
    expect(new Set(answerWords).size).toBe(823);
    expect(acceptedWords.every((word) => /^[A-Z]{5}$/.test(word))).toBe(true);
    expect(answerWords.every((word) => wordDictionary.has(word))).toBe(true);
    expect(wordDictionary.has("APPLE")).toBe(true);
    expect(wordDictionary.has("ALLEY")).toBe(true);
    expect(wordDictionary.has("PUPPY")).toBe(true);
    expect(answerWords).not.toContain("PUPPY");
    expect(wordDictionary.has("ZZZZZ")).toBe(false);
  });

  it("selects uniformly across eligible indices without immediate repeats", () => {
    const random = vi.spyOn(Math, "random");
    const pool = ["APPLE", "CRANE", "SLATE"];
    random.mockReturnValue(0);
    expect(chooseAnswer(pool, "APPLE")).toBe("CRANE");
    random.mockReturnValue(0.99);
    expect(chooseAnswer(pool, "APPLE")).toBe("SLATE");
    expect(chooseAnswer(pool, null)).toBe("SLATE");
    expect(chooseAnswer(["APPLE"], "APPLE")).toBe("APPLE");
    expect(() => chooseAnswer([], null)).toThrow("must not be empty");
  });

  it("ships identical full upstream notices with source attribution", () => {
    const besideData = readFileSync("src/lib/games/words/SCOWL-Copyright.txt");
    expect(readFileSync("public/licenses/scowl-2020.12.07.txt")).toEqual(besideData);
    expect(besideData.byteLength).toBe(11758);
    const notice = besideData.toString();
    expect(notice).toContain("Copyright 2000-2018 by Kevin Atkinson");
    expect(notice).toContain("WordNet 1.6 Copyright 1997 by Princeton University");
    expect(notice).toContain("Copyright 1993, Geoff Kuenning");
  });
});
