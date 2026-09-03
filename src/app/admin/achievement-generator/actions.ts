"use server";

import { generateAchievementDrafts } from "@/lib/services/achievement-generator-service-server";

export async function testGenerateAchievements(): Promise<void> {
  const achievements = await generateAchievementDrafts({
    packId: "test",
    theme: "Evergreen useless internet habits",
    instructions:
      "Generate generic achievements that can be used year-round. Avoid holidays and seasonal references.",
    counts: {
      common: 1,
      rare: 1,
      epic: 0,
      legendary: 0,
    },
  });

  console.log(
    "Generated achievement drafts:",
    JSON.stringify(achievements, null, 2),
  );
}
