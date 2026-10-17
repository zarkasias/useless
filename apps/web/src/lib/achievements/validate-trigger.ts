import {
  ACHIEVEMENT_TRIGGERS,
  AchievementTriggerType,
} from "./trigger-registry";

export function isSupportedTrigger(
  trigger: string,
): trigger is AchievementTriggerType {
  return Object.values(ACHIEVEMENT_TRIGGERS).includes(
    trigger as AchievementTriggerType,
  );
}
