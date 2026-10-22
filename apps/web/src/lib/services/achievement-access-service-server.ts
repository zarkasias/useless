import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { createClient } from "@supabase/supabase-js";
import { achievementPackFilter } from "@/lib/achievements/pack-access";
import { getUserOwnedAchievementPacks } from "./user-achievement-pack-service-server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const getCachedCorePackIds = unstable_cache(
  async (): Promise<string[]> => {
    const { data, error } = await supabaseAdmin
      .from("achievement_packs")
      .select("id")
      .eq("pack_type", "core");

    if (error) {
      console.error("Error loading core achievement packs:", error);
      throw new Error("Unable to determine achievement access.");
    }

    return (data ?? []).map((pack) => pack.id);
  },
  ["core-achievement-pack-ids-v1"],
  {
    revalidate: 60,
    tags: ["core-achievement-pack-ids"],
  },
);

export const getAchievementPackFilter = cache(
  async (userId?: string): Promise<string> => {
    const [corePackIds, ownedPacks] = await Promise.all([
      getCachedCorePackIds(),
      userId ? getUserOwnedAchievementPacks(userId) : Promise.resolve([]),
    ]);

    return achievementPackFilter([
      ...corePackIds,
      ...ownedPacks.map((pack) => pack.pack_id),
    ]);
  },
);
