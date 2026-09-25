import type { AchievementType } from "@/lib/supabase";

export const typeBorderColors: Record<AchievementType, string> = {
  COMMON: "from-gray-100 to-gray-500",
  RARE: "from-gray-100 to-blue-500",
  EPIC: "from-gray-100 to-purple-500",
  LEGENDARY: "from-gray-100 to-amber-500",
  SECRET: "from-gray-100 to-fuchsia-500",
  GAME: "from-gray-100 to-emerald-500",
};

export const typeBadgeColors: Record<AchievementType, string> = {
  COMMON: "bg-gradient-to-r from-gray-500 via-gray-400 to-gray-400 text-white",
  RARE: "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-400 text-white",
  EPIC: "bg-gradient-to-r from-purple-500 via-purple-400 to-purple-400 text-white",
  LEGENDARY:
    "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-400 text-white",
  SECRET:
    "bg-gradient-to-r from-fuchsia-500 via-fuchsia-400 to-fuchsia-400 text-white",
  GAME: "bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 text-white",
};

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
