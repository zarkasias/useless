import "server-only";

import { unstable_cache } from "next/cache";

import { createClient as createAdminClient } from "@supabase/supabase-js";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";

import { getAuthenticatedUser } from "./utils/achievement-utils";
import type { AchievementPackStatus } from "@/lib/types/achievement-pack";

import type { Achievement } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export interface StoreAchievementPack {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  price_cents: number | null;
  currency: string | null;

  starts_at: string | null;
  ends_at: string | null;

  cover_image_path: string | null;
  theme_key: string | null;
  status: AchievementPackStatus;
  isUpcoming: boolean;

  owned: boolean;
  availableForPurchase: boolean;
  hasEnded: boolean;

  totalAchievements: number;
  collectedAchievements: number;
  completed: boolean;
}

const getCachedPackCatalog = unstable_cache(
  async () => {
    const { data: packs, error } = await supabaseAdmin
      .from("achievement_packs")
      .select(
        `
        id,
        name,
        slug,
        description,
        cover_image_path,
        theme_key,
        price_cents,
        currency,
        starts_at,
        ends_at,
        status
      `,
      )
      .neq("pack_type", "core");

    if (error) {
      console.error("Error loading achievement packs:", error);
      throw new Error("Unable to load achievement packs.");
    }

    return packs ?? [];
  },
  ["store-pack-catalog-v1"],
  {
    revalidate: 60,
    tags: ["store-pack-catalog"],
  },
);

const getCachedPackAchievements = unstable_cache(
  async (packIds: string[]) => {
    if (packIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from("achievements")
      .select("id, pack_id")
      .in("pack_id", packIds)
      .eq("status", "published");

    if (error) {
      console.error("Error loading pack achievements:", error);
      throw new Error("Unable to load pack achievements.");
    }

    return data ?? [];
  },
  ["store-pack-achievements-v1"],
  {
    revalidate: 60,
    tags: ["store-pack-achievements"],
  },
);

export async function getStoreAchievementPacks(): Promise<
  StoreAchievementPack[]
> {
  const [user, profile] = await Promise.all([
    getAuthenticatedUser(),
    getAuthenticatedUserProfile(),
  ]);

  const packs = await getCachedPackCatalog();

  if (!packs?.length) {
    return [];
  }

  const packIds = packs.map((pack) => pack.id);

  const achievements = await getCachedPackAchievements([...packIds].sort());

  const ownedPackIds = new Set<string>();
  const collectedAchievementIds = new Set<string>();

  if (user) {
    const [
      { data: ownedPacks, error: ownedError },
      { data: collected, error: collectedError },
    ] = await Promise.all([
      supabaseAdmin
        .from("user_achievement_packs")
        .select("pack_id")
        .eq("user_id", user.id)
        .eq("purchase_status", "owned"),

      supabaseAdmin
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id),
    ]);

    if (ownedError) {
      console.error("Error loading owned achievement packs:", ownedError);
      throw new Error("Unable to load pack ownership.");
    }

    if (collectedError) {
      console.error("Error loading collected achievements:", collectedError);
      throw new Error("Unable to load pack progress.");
    }

    for (const ownedPack of ownedPacks ?? []) {
      ownedPackIds.add(ownedPack.pack_id);
    }

    for (const item of collected ?? []) {
      collectedAchievementIds.add(item.achievement_id);
    }
  }

  const now = Date.now();

  return packs
    .map((pack) => {
      const packAchievements =
        achievements?.filter(
          (achievement) => achievement.pack_id === pack.id,
        ) ?? [];

      const collectedCount = packAchievements.filter((achievement) =>
        collectedAchievementIds.has(achievement.id),
      ).length;

      const owned = ownedPackIds.has(pack.id);

      const startsAt = pack.starts_at
        ? new Date(pack.starts_at).getTime()
        : null;

      const endsAt = pack.ends_at ? new Date(pack.ends_at).getTime() : null;

      const hasStarted = startsAt === null || now >= startsAt;

      const hasEnded = endsAt !== null && now > endsAt;

      const isActive = pack.status === "active";
      const isScheduled = pack.status === "scheduled";

      const availableForPurchase =
        !owned &&
        isActive &&
        hasStarted &&
        !hasEnded &&
        Boolean(pack.price_cents);

      return {
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        description: pack.description,
        cover_image_path: pack.cover_image_path,
        theme_key: pack.theme_key,
        price_cents: pack.price_cents,
        currency: pack.currency,
        starts_at: pack.starts_at,
        ends_at: pack.ends_at,
        status: pack.status,
        owned,
        availableForPurchase,
        isUpcoming: isScheduled,
        hasEnded,

        totalAchievements: packAchievements.length,
        collectedAchievements: collectedCount,

        completed:
          owned &&
          packAchievements.length > 0 &&
          collectedCount === packAchievements.length,
      };
    })
    .filter(
      (pack) =>
        profile?.role === "admin" ||
        pack.availableForPurchase ||
        pack.isUpcoming ||
        pack.owned,
    );
}

export async function getPublishedAchievementsForPack(
  packId: string,
): Promise<Achievement[]> {
  const { data, error } = await supabaseAdmin
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
      pack_id,
      trigger_type,
      trigger_config,
      status
    `,
    )
    .eq("pack_id", packId)
    .eq("status", "published")
    .order("type")
    .order("title");

  if (error) {
    console.error("Error loading pack achievements:", error);
    throw new Error("Unable to load pack achievements.");
  }

  return (data ?? []) as Achievement[];
}
