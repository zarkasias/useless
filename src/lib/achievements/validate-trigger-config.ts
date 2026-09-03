import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";

function isValidHour(value: number | null) {
  return value !== null && value >= 0 && value <= 23;
}

function isValidMinute(value: number | null) {
  return value !== null && value >= 0 && value <= 59;
}

export function validateTriggerConfig(
  achievement: GeneratedAchievementDraft,
): boolean {
  const config = achievement.triggerConfig;

  switch (achievement.triggerType) {
    case "daily_claim":
      return true;

    case "login_time":
      return (
        isValidHour(config.startHour) &&
        isValidMinute(config.startMinute) &&
        isValidHour(config.endHour) &&
        isValidMinute(config.endMinute)
      );

    case "login_date":
      return (
        config.month !== null &&
        config.month >= 1 &&
        config.month <= 12 &&
        config.day !== null &&
        config.day >= 1 &&
        config.day <= 31
      );

    case "consecutive_days":
      return config.days !== null && config.days > 0;

    case "achievement_count":
      return config.count !== null && config.count > 0;

    case "rarity_count":
      return (
        config.rarity !== null && config.count !== null && config.count > 0
      );

    case "pack_completion":
      return config.packSlug !== null && config.packSlug.trim().length > 0;

    case "account_age":
      return config.days !== null && config.days > 0;

    default:
      return false;
  }
}
