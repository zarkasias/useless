"use server";

import { Achievement } from "@/lib/supabase";
import { getRandomAchievement } from "@/lib/achievement-generator";
import { unlockAchievementForCurrentUser } from "@/lib/achievement-service-server";

export async function unlockRandomAchievementAction(): Promise<Achievement | null> {
  const achievement = getRandomAchievement();

  return await unlockAchievementForCurrentUser(achievement);
}
