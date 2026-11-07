import tokens from "@useless/design-tokens/tokens.json";
import type { AchievementType } from "@/lib/supabase";

const rarity = tokens.color.rarity;
const achievementCard = tokens.component.achievementCard;

export const typeNames: Record<AchievementType, string> = {
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  SECRET: "Secret",
  GAME: "Game",
};

export const rarityTagClass =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs uppercase font-semibold";

export const rarityTokens = rarity;
export const achievementCardTokens = achievementCard;

export function getRarityToken(type: AchievementType) {
  return rarity[type.toLowerCase() as keyof typeof rarity];
}

// White is only about 2:1 on the amber Legendary badge.
export function getBadgeTextColor(type: AchievementType) {
  return type === "LEGENDARY"
    ? achievementCard.badge.textColorLegendary
    : achievementCard.badge.textColor;
}
