import { Achievement } from "@/lib/supabase";

export type DailyClaimTriggerConfig = {
  days?: string[] | null;
  startHour?: number | null;
  startMinute?: number | null;
  endHour?: number | null;
  endMinute?: number | null;
};

export function isDailyAchievementEligible(
  achievement: Achievement,
  timezone: string,
): boolean {
  if (achievement.trigger_type !== "daily_claim") {
    return true;
  }

  const config = (achievement.trigger_config ?? {}) as DailyClaimTriggerConfig;

  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts
    .find((part) => part.type === "weekday")
    ?.value.toLowerCase();

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);

  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0,
  );

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
