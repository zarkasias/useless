import "server-only";

import { createClient } from "@supabase/supabase-js";
import { achievementPackFilter } from "@/lib/achievements/pack-access";
import { getUserOwnedAchievementPacks } from "./user-achievement-pack-service-server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getAchievementPackFilter(userId?: string): Promise<string> {
  const [{ data: corePacks, error }, ownedPacks] = await Promise.all([
    supabaseAdmin.from("achievement_packs").select("id").eq("pack_type", "core"),
    userId ? getUserOwnedAchievementPacks(userId) : Promise.resolve([]),
  ]);

  // Fail closed if ownership or core pack information cannot be loaded.
  if (error) {
    console.error("Error loading core achievement packs:", error);
    throw new Error("Unable to determine achievement access.");
  }

  return achievementPackFilter([
    ...(corePacks ?? []).map((pack) => pack.id),
    ...ownedPacks.map((pack) => pack.pack_id),
  ]);
}
