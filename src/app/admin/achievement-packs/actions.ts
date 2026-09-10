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

export async function createAchievementPack(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  const packType = String(formData.get("pack_type") ?? "seasonal");

  const status = String(formData.get("status") ?? "draft");

  const startsAt = String(formData.get("starts_at") ?? "").trim() || null;

  const endsAt = String(formData.get("ends_at") ?? "").trim() || null;

  if (!name || !slug) {
    throw new Error("Name and slug are required.");
  }

  const { error } = await supabaseAdmin.from("achievement_packs").insert({
    name,
    slug,
    description,
    pack_type: packType,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) {
    console.error("Error creating achievement pack:", error);
    throw new Error("Unable to create achievement pack.");
  }

  revalidatePath("/admin/achievement-packs");

  redirect("/admin/achievement-packs");
}

export async function updateAchievementPack(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  const description = String(formData.get("description") ?? "").trim() || null;

  const packType = String(formData.get("pack_type") ?? "seasonal");

  const themeKey = String(formData.get("theme_key") ?? "").trim() || null;

  const status = String(formData.get("status") ?? "draft");

  const startsAt = String(formData.get("starts_at") ?? "").trim() || null;

  const endsAt = String(formData.get("ends_at") ?? "").trim() || null;

  if (!id || !name || !slug) {
    throw new Error("Pack id, name, and slug are required.");
  }

  const { error } = await supabaseAdmin
    .from("achievement_packs")
    .update({
      name,
      slug,
      description,
      pack_type: packType,
      theme_key: themeKey,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating achievement pack:", error);
    throw new Error("Unable to update achievement pack.");
  }

  revalidatePath("/admin/achievement-packs");
  revalidatePath(`/admin/achievement-packs/${id}`);

  redirect("/admin/achievement-packs");
}
