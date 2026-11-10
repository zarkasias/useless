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

export async function updateAdminAchievement(
  formData: FormData,
): Promise<void> {
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

  const dailyValue = formData.get("is_daily");

  if (dailyValue !== "true" && dailyValue !== "false") {
    throw new Error("Choose whether this is a daily achievement.");
  }

  const isDaily = dailyValue === "true";

  const triggerValue = formData.get("trigger_type");

  if (typeof triggerValue !== "string") {
    throw new Error("Choose an achievement trigger.");
  }

  const triggerType = triggerValue.trim() || null;

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

  const { data: existingAchievement, error: lookupError } = await supabaseAdmin
    .from("achievements")
    .select("id, trigger_type")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("Error loading achievement:", lookupError);
    throw new Error("Unable to load achievement.");
  }

  if (!existingAchievement) {
    throw new Error("Achievement not found.");
  }

  const existingTrigger = existingAchievement.trigger_type;

  if (
    existingTrigger !== null &&
    existingTrigger !== "daily_claim" &&
    triggerType !== existingTrigger
  ) {
    throw new Error(
      "Automatic and manual-award triggers cannot be changed from this form.",
    );
  }

  if (
    triggerType !== null &&
    triggerType !== "daily_claim" &&
    triggerType !== existingTrigger
  ) {
    throw new Error("Invalid achievement trigger.");
  }

  if (triggerType === "daily_claim" && !isDaily) {
    throw new Error(
      "Set Daily achievement to Yes when using the Daily claim trigger.",
    );
  }

  if (isDaily && triggerType !== null && triggerType !== "daily_claim") {
    throw new Error(
      "Automatic and manual-award achievements cannot enter the daily pool.",
    );
  }

  if (isDaily && type === "GAME") {
    throw new Error("Game achievements must remain outside the daily pool.");
  }

  if (packId) {
    const { data: pack, error: packError } = await supabaseAdmin
      .from("achievement_packs")
      .select("id")
      .eq("id", packId)
      .maybeSingle();

    if (packError) {
      console.error("Error validating achievement pack:", packError);
      throw new Error("Unable to validate the selected achievement pack.");
    }

    if (!pack) {
      throw new Error("Selected achievement pack does not exist.");
    }
  }

  if (status === "published" && !iconPath) {
    throw new Error(
      "An achievement must have an icon before it can be published.",
    );
  }

  const { data: updatedAchievement, error: updateError } = await supabaseAdmin
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
      is_daily: isDaily,
      trigger_type: triggerType,
      status,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Error updating achievement:", updateError);
    throw new Error("Unable to update achievement.");
  }

  if (!updatedAchievement) {
    throw new Error("Achievement no longer exists.");
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
