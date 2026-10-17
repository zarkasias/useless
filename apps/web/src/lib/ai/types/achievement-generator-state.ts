import type { GeneratedAchievementDraft } from "./generated-achievement";

export interface AchievementGeneratorState {
  success: boolean;
  error: string | null;
  packId: string | null;
  achievements: GeneratedAchievementDraft[];
}
