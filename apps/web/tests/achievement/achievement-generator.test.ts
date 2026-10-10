import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementType } from "@/lib/supabase";
import { getRandomAchievementType } from "@/lib/achievement-generator";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
});

describe("getRandomAchievementType", () => {
  it("returns null without drawing randomness when no types are available", () => {
    expect(getRandomAchievementType([])).toBeNull();

    expect(Math.random).not.toHaveBeenCalled();
  });

  it.each<{
    type: AchievementType;
  }>([
    { type: "COMMON" },
    { type: "RARE" },
    { type: "EPIC" },
    { type: "LEGENDARY" },
    { type: "SECRET" },
    { type: "GAME" },
  ])("returns $type when it is the only available type", ({ type }) => {
    vi.mocked(Math.random).mockReturnValue(0.999);

    expect(getRandomAchievementType([type])).toBe(type);
  });

  it.each<{
    random: number;
    expected: AchievementType;
  }>([
    { random: 0, expected: "COMMON" },
    { random: 0.59, expected: "COMMON" },
    { random: 0.6, expected: "RARE" },
    { random: 0.84, expected: "RARE" },
    { random: 0.85, expected: "EPIC" },
    { random: 0.96, expected: "EPIC" },
    { random: 0.97, expected: "LEGENDARY" },
    { random: 0.999, expected: "LEGENDARY" },
  ])("selects $expected for random value $random", ({ random, expected }) => {
    vi.mocked(Math.random).mockReturnValue(random);

    expect(
      getRandomAchievementType(["COMMON", "RARE", "EPIC", "LEGENDARY"]),
    ).toBe(expected);
  });

  it.each<{
    random: number;
    expected: AchievementType;
  }>([
    { random: 0, expected: "SECRET" },
    { random: 0.32, expected: "SECRET" },
    { random: 0.34, expected: "GAME" },
    { random: 0.999, expected: "GAME" },
  ])(
    "normalizes weights across only the available types at $random",
    ({ random, expected }) => {
      vi.mocked(Math.random).mockReturnValue(random);

      expect(getRandomAchievementType(["SECRET", "GAME"])).toBe(expected);
    },
  );

  it("does not increase a type's weight when it appears more than once", () => {
    vi.mocked(Math.random).mockReturnValue(0.75);

    expect(getRandomAchievementType(["COMMON", "COMMON", "RARE"])).toBe("RARE");
  });

  it("uses the supplied order when mapping the weighted draw", () => {
    vi.mocked(Math.random).mockReturnValue(0);

    expect(getRandomAchievementType(["RARE", "COMMON"])).toBe("RARE");
  });

  it("returns the last available type if the draw reaches the upper boundary", () => {
    // Forces the fallback path; normal Math.random() values are below 1.
    vi.mocked(Math.random).mockReturnValue(1);

    expect(getRandomAchievementType(["COMMON", "RARE"])).toBe("RARE");
  });
});
