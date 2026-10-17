import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export type AdminAchievementStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";

export interface AdminAchievement {
  id: string;
  title: string;
  description: string;
  type: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  emoji: string | null;
  icon_path: string | null;

  status: AdminAchievementStatus;
  generated_by: "manual" | "ai";

  category: string | null;

  trigger_type: string | null;
  trigger_config: Record<string, unknown> | null;

  icon_concept: string | null;
  image_prompt: string | null;

  pack_id: string | null;
  is_daily: boolean;

  created_at: string;

  achievement_packs:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
}

export interface AdminDashboardStats {
  drafts: number;
  published: number;
  archived: number;
  missingIcons: number;
  aiGenerated: number;
}

export async function getAdminAchievements(
  status?: AdminAchievementStatus,
  missingIcon = false,
): Promise<AdminAchievement[]> {
  await requireAdmin();

  let query = supabaseAdmin
    .from("achievements")
    .select(
      `   
        id,
      title,
      description,
      type,
      emoji,
      icon_path,
      status,
      generated_by,
      category,
      trigger_type,
      trigger_config,
      icon_concept,
      image_prompt,
      pack_id,
      is_daily,
      created_at,
      achievement_packs (
        id,
        name,
        slug
      )
        `,
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (missingIcon) {
    query = query.neq("status", "archived").is("icon_path", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading admin achievements:", error);
    throw new Error("Unable to load achievements.");
  }

  return (data ?? []) as AdminAchievement[];
}

export async function getAdminAchievementById(
  id: string,
): Promise<AdminAchievement | null> {
  await requireAdmin();

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
      status,
      generated_by,
      category,
      trigger_type,
      trigger_config,
      icon_concept,
      image_prompt,
      pack_id,
      is_daily,
      created_at,
      achievement_packs (
        id,
        name,
        slug
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading achievement:", error);
    throw new Error("Unable to load achievement.");
  }

  return data as AdminAchievement | null;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireAdmin();

  const [
    draftsResult,
    publishedResult,
    archivedResult,
    missingIconsResult,
    aiGeneratedResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("achievements")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),

    supabaseAdmin
      .from("achievements")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),

    supabaseAdmin
      .from("achievements")
      .select("*", { count: "exact", head: true })
      .eq("status", "archived"),

    supabaseAdmin
      .from("achievements")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived")
      .is("icon_path", null),

    supabaseAdmin
      .from("achievements")
      .select("*", { count: "exact", head: true })
      .eq("generated_by", "ai"),
  ]);

  const errors = [
    draftsResult.error,
    publishedResult.error,
    archivedResult.error,
    missingIconsResult.error,
    aiGeneratedResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("Error loading admin dashboard stats:", errors);
    throw new Error("Unable to load admin dashboard stats.");
  }

  return {
    drafts: draftsResult.count ?? 0,
    published: publishedResult.count ?? 0,
    archived: archivedResult.count ?? 0,
    missingIcons: missingIconsResult.count ?? 0,
    aiGenerated: aiGeneratedResult.count ?? 0,
  };
}
