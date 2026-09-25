import { AchievementType } from "./supabase";

const achievementTypeWeights: Record<AchievementType, number> = {
  COMMON: 60,
  RARE: 25,
  EPIC: 12,
  LEGENDARY: 3,
  SECRET: 1,
  GAME: 2,
};

/**
 * Select an achievement rarity using the configured weights.
 *
 * Only types that currently have available achievements are considered.
 * The weights are automatically normalized across those available types.
 */
export function getRandomAchievementType(
  availableTypes: AchievementType[],
): AchievementType | null {
  if (availableTypes.length === 0) {
    return null;
  }

  const uniqueTypes = Array.from(new Set(availableTypes));

  const availableWeights = uniqueTypes.map((type) => ({
    type,
    weight: achievementTypeWeights[type],
  }));

  const totalWeight = availableWeights.reduce(
    (total, item) => total + item.weight,
    0,
  );

  let random = Math.random() * totalWeight;

  for (const item of availableWeights) {
    random -= item.weight;

    if (random < 0) {
      return item.type;
    }
  }

  return availableWeights[availableWeights.length - 1].type;
}
