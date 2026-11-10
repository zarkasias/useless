import { Achievement } from "@/lib/supabase";

export type DailyClaimTriggerConfig = {
  days?: string[] | null;
  startHour?: number | null;
  startMinute?: number | null;
  endHour?: number | null;
  endMinute?: number | null;
  month?: number | null;
  day?: number | null;
};

type ZonedParts = {
  weekday?: string;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(timezone: string, date: Date): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const numberPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    weekday: parts.find((part) => part.type === "weekday")?.value.toLowerCase(),
    month: numberPart("month"),
    day: numberPart("day"),
    hour: numberPart("hour"),
    minute: numberPart("minute"),
  };
}

function isEligibleForParts(
  achievement: Achievement,
  { weekday, month, day, hour, minute }: ZonedParts,
): boolean {
  if (achievement.trigger_type !== "daily_claim") {
    return true;
  }

  const config = (achievement.trigger_config ?? {}) as DailyClaimTriggerConfig;

  if (
    config.month !== null &&
    config.month !== undefined &&
    month !== config.month
  ) {
    return false;
  }

  if (config.day !== null && config.day !== undefined && day !== config.day) {
    return false;
  }

  if (config.days?.length && (!weekday || !config.days.includes(weekday))) {
    return false;
  }

  const currentMinutes = hour * 60 + minute;

  const hasStart = config.startHour !== null && config.startHour !== undefined;

  const hasEnd = config.endHour !== null && config.endHour !== undefined;

  if (hasStart) {
    const startMinutes = config.startHour! * 60 + (config.startMinute ?? 0);

    if (currentMinutes < startMinutes) {
      return false;
    }
  }

  if (hasEnd) {
    const endMinutes = config.endHour! * 60 + (config.endMinute ?? 59);

    if (currentMinutes > endMinutes) {
      return false;
    }
  }
  return true;
}

export function isDailyAchievementEligible(
  achievement: Achievement,
  timezone: string,
  now = new Date(),
): boolean {
  return isEligibleForParts(achievement, getZonedParts(timezone, now));
}

const MINUTE_MS = 60 * 1000;
const NEXT_ELIGIBILITY_LOOKAHEAD_MINUTES = 7 * 24 * 60;

/**
 * Find the next moment any of the given achievements becomes claimable,
 * looking up to a week ahead. Returns null when nothing opens in that time
 * (for example when only date-specific achievements remain).
 */
export function getNextDailyEligibility(
  achievements: Achievement[],
  timezone: string,
  now = new Date(),
): Date | null {
  if (achievements.length === 0) {
    return null;
  }

  const firstMinute = Math.floor(now.getTime() / MINUTE_MS) + 1;

  for (let offset = 0; offset < NEXT_ELIGIBILITY_LOOKAHEAD_MINUTES; offset++) {
    const candidate = new Date((firstMinute + offset) * MINUTE_MS);
    const parts = getZonedParts(timezone, candidate);

    if (
      achievements.some((achievement) => isEligibleForParts(achievement, parts))
    ) {
      return candidate;
    }
  }

  return null;
}
