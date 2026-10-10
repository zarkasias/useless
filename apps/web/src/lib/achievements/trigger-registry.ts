export const ACHIEVEMENT_TRIGGERS = {
  DAILY_CLAIM: "daily_claim",
  LOGIN_TIME: "login_time",
  LOGIN_DATE: "login_date",
  CONSECUTIVE_DAYS: "consecutive_days",
  ACHIEVEMENT_COUNT: "achievement_count",
  RARITY_COUNT: "rarity_count",
  PACK_COMPLETION: "pack_completion",
  ACCOUNT_AGE: "account_age",
} as const;

export type AchievementTriggerType =
  (typeof ACHIEVEMENT_TRIGGERS)[keyof typeof ACHIEVEMENT_TRIGGERS];

export type AchievementTriggerConfig =
  | {
      type: "daily_claim";
    }
  | {
      type: "login_time";
      startHour: number;
      endHour: number;
    }
  | {
      type: "login_date";
      month: number;
      day: number;
    }
  | {
      type: "consecutive_days";
      days: number;
    }
  | {
      type: "achievement_count";
      count: number;
    }
  | {
      type: "rarity_count";
      rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
      count: number;
    }
  | {
      type: "pack_completion";
      packSlug: string;
    }
  | {
      type: "account_age";
      days: number;
    };

export const ACHIEVEMENT_TRIGGER_DESCRIPTIONS = {
  daily_claim: "Awarded through the normal daily achievement claim system.",

  login_time:
    "Awarded when the user is active during a specific local-time range.",

  login_date: "Awarded when the user is active on a specific calendar date.",

  consecutive_days:
    "Awarded after maintaining a streak for a specified number of days.",

  achievement_count:
    "Awarded after collecting a specified number of achievements.",

  rarity_count:
    "Awarded after collecting a specified number of achievements of one rarity.",

  pack_completion:
    "Awarded after collecting every achievement in a specific pack.",

  account_age: "Awarded once the account reaches a specified age in days.",
} satisfies Record<AchievementTriggerType, string>;
