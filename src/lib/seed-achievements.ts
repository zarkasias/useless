import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { achievementPool, dailyAchievementPool } from "./achievement-generator";
import { AchievementType } from "./supabase";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const generateSlug = (title: string, isDaily = false): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return isDaily ? `daily-${slug}` : slug;
};

async function seedAchievements() {
  console.log("Starting achievement migration...\n");

  const achievements = [];

  // Regular achievements
  for (const [type, pool] of Object.entries(achievementPool)) {
    for (const achievement of pool) {
      achievements.push({
        slug: generateSlug(achievement.title),
        title: achievement.title,
        description: achievement.description,
        type: type as AchievementType,
        emoji: achievement.emoji,
        is_daily: false,
      });
    }
  }

  // Daily achievements
  for (const achievement of dailyAchievementPool) {
    achievements.push({
      slug: generateSlug(achievement.title, true),
      title: achievement.title,
      description: achievement.description,
      type: "RARE" as AchievementType,
      emoji: achievement.emoji,
      is_daily: true,
    });
  }

  console.log(`Found ${achievements.length} achievements to migrate.\n`);

  const { data, error } = await supabase
    .from("achievements")
    .upsert(achievements, {
      onConflict: "slug",
    })
    .select();

  if (error) {
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
  }

  console.log(`Successfully migrated ${data.length} achievements.\n`);

  const counts = achievements.reduce(
    (result, achievement) => {
      if (achievement.is_daily) {
        result.DAILY++;
      } else {
        result[achievement.type]++;
      }

      return result;
    },
    {
      COMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
      DAILY: 0,
    },
  );

  console.log("Migration summary:");
  console.log(`COMMON:    ${counts.COMMON}`);
  console.log(`RARE:      ${counts.RARE}`);
  console.log(`EPIC:      ${counts.EPIC}`);
  console.log(`LEGENDARY: ${counts.LEGENDARY}`);
  console.log(`DAILY:     ${counts.DAILY}`);
}

seedAchievements();
