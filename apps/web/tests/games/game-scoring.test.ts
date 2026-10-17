import { describe, expect, it } from "vitest";

import { calculateMemoryScore } from "@/lib/games/memory/memory-scoring";
import { calculateKlondikeScore } from "@/lib/games/solitaire/klondike/klondike-scoring";
import { calculateSpiderScore } from "@/lib/games/solitaire/spider/spider-scoring";

describe("Memory scoring", () => {
  it.each([
    { moves: 6, mistakes: 0, durationSeconds: 20, expected: 1000 },
    { moves: 7, mistakes: 0, durationSeconds: 20, expected: 965 },
    { moves: 6, mistakes: 1, durationSeconds: 20, expected: 960 },
    { moves: 6, mistakes: 0, durationSeconds: 21, expected: 998 },
    { moves: 8, mistakes: 2, durationSeconds: 30, expected: 830 },
    { moves: 100, mistakes: 100, durationSeconds: 1000, expected: 0 },
  ])(
    "scores $moves moves, $mistakes mistakes, and $durationSeconds seconds as $expected",
    ({ expected, ...input }) => {
      expect(calculateMemoryScore({ pairs: 6, ...input })).toBe(expected);
    },
  );
});

describe("Klondike scoring", () => {
  it("scores a loss as zero", () => {
    expect(
      calculateKlondikeScore({
        result: "loss",
        moves: 80,
        durationSeconds: 180,
      }),
    ).toBe(0);
  });

  it.each([
    { moves: 80, durationSeconds: 180, expected: 1000 },
    { moves: 81, durationSeconds: 180, expected: 996 },
    { moves: 80, durationSeconds: 181, expected: 1000 },
    { moves: 80, durationSeconds: 182, expected: 999 },
    { moves: 90, durationSeconds: 200, expected: 950 },
    { moves: 1000, durationSeconds: 10000, expected: 100 },
  ])(
    "scores a win with $moves moves in $durationSeconds seconds as $expected",
    ({ expected, ...input }) => {
      expect(
        calculateKlondikeScore({
          result: "win",
          ...input,
        }),
      ).toBe(expected);
    },
  );

  it("does not penalize auto-finish", () => {
    const input = {
      result: "win" as const,
      moves: 90,
      durationSeconds: 200,
    };

    expect(
      calculateKlondikeScore({
        ...input,
        autoFinished: true,
      }),
    ).toBe(
      calculateKlondikeScore({
        ...input,
        autoFinished: false,
      }),
    );
  });
});

describe("Spider scoring", () => {
  it.each([
    { moves: 0, expected: 1300 },
    { moves: 100, expected: 1200 },
    { moves: 1300, expected: 0 },
    { moves: 1400, expected: 0 },
  ])("scores a win with $moves moves as $expected", ({ moves, expected }) => {
    expect(calculateSpiderScore({ result: "win", moves })).toBe(expected);
  });

  it.each(["loss", "abandoned"] as const)("scores %s as zero", (result) => {
    expect(calculateSpiderScore({ result, moves: 100 })).toBe(0);
  });

  it.each([-1, 1.5, NaN, Infinity])("rejects invalid moves %s", (moves) => {
    expect(() => calculateSpiderScore({ result: "win", moves })).toThrow(
      "Moves must be a non-negative integer",
    );
  });
});
