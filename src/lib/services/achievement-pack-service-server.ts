import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { AchievementPack } from "@/lib/types/achievement-pack";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function getAchievementPacks(): Promise<AchievementPack[]> {
  const { data, error } = await supabaseAdmin
    .from("achievement_packs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching achievement packs", error);
    throw new Error("Unable to load achhievement packs.");
  }

  return (data ?? []) as AchievementPack[];
}

export async function getAchievementPackById(
  id: string,
): Promise<AchievementPack | null> {
  const { data, error } = await supabaseAdmin
    .from("achievement_packs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching achievement pack:", error);
    throw new Error("Unable to load achievement pack.");
  }

  return data as AchievementPack | null;
}
