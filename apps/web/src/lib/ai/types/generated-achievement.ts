import type { AchievementTriggerType } from "@/lib/achievements/trigger-registry";

export type GeneratedAchievementRarity =
  | "COMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY";

export interface GeneratedAchievementDraft {
  title: string;
  description: string;
  rarity: GeneratedAchievementRarity;
  emoji: string;

  triggerType: AchievementTriggerType;

  triggerConfig: {
    startHour: number | null;
    startMinute: number | null;
    endHour: number | null;
    endMinute: number | null;

    month: number | null;
    day: number | null;

    days: number | null;
    count: number | null;

    rarity: GeneratedAchievementRarity | null;
    packSlug: string | null;
  };

  iconConcept: string;

  imagePrompt: string;
}
