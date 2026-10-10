"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function updateAdminAchievement(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const type = String(formData.get("type") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim() || null;
  const iconPath = String(formData.get("icon_path") ?? "").trim() || null;

  const iconConcept = String(formData.get("icon_concept") ?? "").trim() || null;

  const imagePrompt = String(formData.get("image_prompt") ?? "").trim() || null;

  const category = String(formData.get("category") ?? "").trim() || null;

  const packId = String(formData.get("pack_id") ?? "").trim() || null;

  const status = String(formData.get("status") ?? "").trim();

  if (!id || !title || !description) {
    throw new Error("Achievement id, title, and description are required.");
  }

  const validTypes = ["COMMON", "RARE", "EPIC", "LEGENDARY", "SECRET", "GAME"];

  if (!validTypes.includes(type)) {
    throw new Error("Invalid achievement rarity.");
  }

  const validCategories = [
    "everyday",
    "time_routine",
    "developer",
    "digital_life",
    "milestone",
    "calendar",
    "seasonal",
    "review",
  ];

  if (category && !validCategories.includes(category)) {
    throw new Error("Invalid achievement category.");
  }

  const validStatuses = ["draft", "published", "archived"];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid achievement status.");
  }

  if (packId) {
    const { data: pack, error: packError } = await supabaseAdmin
      .from("achievement_packs")
      .select("id")
      .eq("id", packId)
      .maybeSingle();

    if (packError || !pack) {
      throw new Error("Selected achievement pack does not exist.");
    }
  }

  if (status === "published" && !iconPath) {
    throw new Error(
      "An achievement must have an icon before it can be published.",
    );
  }

  const { error } = await supabaseAdmin
    .from("achievements")
    .update({
      title,
      description,
      type,
      emoji,
      icon_path: iconPath,
      icon_concept: iconConcept,
      image_prompt: imagePrompt,
      category,
      pack_id: packId,
      status,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating achievement:", error);
    throw new Error("Unable to update achievement.");
  }

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);

  redirect(`/admin/achievements/${id}`);
}

export async function publishAdminAchievement(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Achievement id is required.");
  }

  const { data: achievement, error: loadError } = await supabaseAdmin
    .from("achievements")
    .select("id, title, description, icon_path, trigger_type, trigger_config")
    .eq("id", id)
    .single();

  if (loadError || !achievement) {
    throw new Error("Unable to load achievement.");
  }

  if (!achievement.title || !achievement.description) {
    throw new Error(
      "Achievement requires a title and description before publishing.",
    );
  }

  if (!achievement.icon_path) {
    throw new Error("Achievement requires an icon before publishing.");
  }

  if (!achievement.trigger_type) {
    throw new Error("Achievement requires a trigger before publishing.");
  }

  const { error } = await supabaseAdmin
    .from("achievements")
    .update({
      status: "published",
    })
    .eq("id", id);

  if (error) {
    console.error("Error publishing achievement:", error);
    throw new Error("Unable to publish achievement.");
  }

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);

  redirect(`/admin/achievements/${id}`);
}

export async function archiveAdminAchievement(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Achievement id is required.");
  }

  const { error } = await supabaseAdmin
    .from("achievements")
    .update({
      status: "archived",
    })
    .eq("id", id);

  if (error) {
    console.error("Error archiving achievement:", error);
    throw new Error("Unable to archive achievement.");
  }

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);

  redirect(`/admin/achievements/${id}`);
}

export async function returnAchievementToDraft(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Achievement id is required.");
  }

  const { error } = await supabaseAdmin
    .from("achievements")
    .update({
      status: "draft",
    })
    .eq("id", id);

  if (error) {
    console.error("Error returning achievement to draft:", error);

    throw new Error("Unable to return achievement to draft.");
  }

  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/${id}`);

  redirect(`/admin/achievements/${id}`);
}
