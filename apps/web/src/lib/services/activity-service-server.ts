import "server-only";

import { supabaseAdmin } from "./utils/trigger-context";
import { getFriends } from "./friend-service-server";

export interface FriendActivityItem {
  id: string;
  created_at: string;

  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };

  achievement: {
    id: string;
    title: string;
    type: string;
    emoji: string;
    icon_path: string | null;
  };
}

export async function getFriendActivity(
  userId: string,
  limit = 20,
): Promise<FriendActivityItem[]> {
  const friends = await getFriends(userId);

  const friendIds = friends.map((item) => item.friend.id);

  if (friendIds.length === 0) {
    return [];
  }

  const [
    { data: activityRows, error: activityError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("user_achievements")
      .select(
        `
        id,
        user_id,
        created_at,
        achievement:achievements!user_achievements_achievement_id_fkey (
          id,
          title,
          type,
          emoji,
          icon_path
        )
      `,
      )
      .in("user_id", friendIds)
      .order("created_at", {
        ascending: false,
      })
      .limit(limit),

    supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        username,
        avatar_url
      `,
      )
      .in("id", friendIds),
  ]);

  if (activityError) {
    console.error("Error loading friend activity:", activityError);

    throw new Error("Unable to load friend activity.");
  }

  if (profilesError) {
    console.error("Error loading friend profiles:", profilesError);

    throw new Error("Unable to load friend profiles.");
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return (activityRows ?? [])
    .map((row) => {
      const profile = profileMap.get(row.user_id);

      const achievement = Array.isArray(row.achievement)
        ? row.achievement[0]
        : row.achievement;

      if (!profile || !achievement) {
        return null;
      }

      return {
        id: row.id,
        created_at: row.created_at,
        user: {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        },
        achievement: {
          id: achievement.id,
          title: achievement.title,
          type: achievement.type,
          emoji: achievement.emoji,
          icon_path: achievement.icon_path,
        },
      };
    })
    .filter((item): item is FriendActivityItem => item !== null);
}
