import "server-only";

import { supabaseAdmin } from "./utils/trigger-context";
import type { Achievement } from "@/lib/supabase";

export interface PublicUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export async function getPublicProfileByUsername(
  username: string,
): Promise<PublicUserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Error loading public profile:", error);
    return null;
  }

  return data;
}

export async function getPublicProfileAchievements(
  userId: string,
): Promise<Achievement[]> {
  const { data, error } = await supabaseAdmin
    .from("user_achievements")
    .select(
      `
      created_at,
      achievements!inner (
        id,
        title,
        description,
        type,
        emoji,
        icon_path,
        created_at,
        is_daily,
        is_secret,
        trigger_type,
        trigger_config,
        status
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public profile achievements:", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const achievement = Array.isArray(row.achievements)
      ? row.achievements[0]
      : row.achievements;

    if (!achievement) {
      return [];
    }

    return [
      {
        ...achievement,
        user_id: userId,
        created_at: row.created_at,
      } as Achievement,
    ];
  });
}
