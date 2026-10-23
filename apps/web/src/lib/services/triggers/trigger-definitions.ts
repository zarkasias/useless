import "server-only";

import { supabaseAdmin } from "../utils/trigger-context";
import { getAchievementPackFilter } from "../achievement-access-service-server";

export const TRIGGER_TYPES = [
  "account_age",
  "streak",
  "collection_count",
] as const;

export async function getTriggerDefinitions(userId: string) {
  const packFilter = await getAchievementPackFilter(userId);

  return supabaseAdmin
    .from("achievements")
    .select(
      `
      id,
      title,
      description,
      type,
      emoji,
      icon_path,
      created_at,
      is_daily,
      is_secret,
      status,
      trigger_type,
      trigger_config
      `,
    )
    .eq("status", "published")
    .or(packFilter)
    .in("trigger_type", [...TRIGGER_TYPES])
    .eq("is_daily", false);
}
