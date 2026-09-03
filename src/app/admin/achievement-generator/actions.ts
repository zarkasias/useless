"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupportedTrigger } from "@/lib/achievements/validate-trigger";
import { validateTriggerConfig } from "@/lib/achievements/validate-trigger-config";

import { generateAchievementDrafts } from "@/lib/services/achievement-generator-service-server";

import type { AchievementGeneratorState } from "@/lib/ai/types/achievement-generator-state";
import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";
import type { SaveAchievementDraftState } from "@/lib/ai/types/save-achievement-draft-state";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function generateAchievementsAction(
  previousState: AchievementGeneratorState,
  formData: FormData,
): Promise<AchievementGeneratorState> {
  try {
    const packId = String(formData.get("packId") ?? "").trim();
    const theme = String(formData.get("theme") ?? "").trim();
    const instructions =
      String(formData.get("instructions") ?? "").trim() || undefined;

    const common = Number(formData.get("common") ?? 0);
    const rare = Number(formData.get("rare") ?? 0);
    const epic = Number(formData.get("epic") ?? 0);
    const legendary = Number(formData.get("legendary") ?? 0);

    if (!packId) {
      return {
        success: false,
        error: "Please select an achievement pack.",
        packId: null,
        achievements: [],
      };
    }

    if (!theme) {
      return {
        success: false,
        error: "Please enter a theme.",
        packId: null,
        achievements: [],
      };
    }

    const total = common + rare + epic + legendary;

    if (total <= 0) {
      return {
        success: false,
        error: "Generate at least one achievement.",
        packId: null,
        achievements: [],
      };
    }

    const achievements = await generateAchievementDrafts({
      packId,
      theme,
      instructions,
      counts: {
        common,
        rare,
        epic,
        legendary,
      },
    });

    return {
      success: true,
      error: null,
      packId,
      achievements,
    };
  } catch (error) {
    console.error("Achievement generation failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate achievements.",
      packId: null,
      achievements: [],
    };
  }
}

export async function saveGeneratedAchievementDraftAction(
  previousState: SaveAchievementDraftState,
  formData: FormData,
): Promise<SaveAchievementDraftState> {
  try {
    await requireAdmin();

    const packId = String(formData.get("packId") ?? "").trim();
    const rawDraft = String(formData.get("draft") ?? "").trim();

    if (!packId) {
      return {
        success: false,
        error: "Achievement pack is missing.",
        achievementId: null,
      };
    }

    if (!rawDraft) {
      return {
        success: false,
        error: "Achievement draft is missing.",
        achievementId: null,
      };
    }

    let draft: GeneratedAchievementDraft;

    try {
      draft = JSON.parse(rawDraft) as GeneratedAchievementDraft;
    } catch {
      return {
        success: false,
        error: "Achievement draft is invalid.",
        achievementId: null,
      };
    }

    if (
      !draft.title?.trim() ||
      !draft.description?.trim() ||
      !draft.imagePrompt?.trim() ||
      !draft.iconConcept?.trim()
    ) {
      return {
        success: false,
        error: "Achievement draft is incomplete.",
        achievementId: null,
      };
    }

    const validRarities = ["COMMON", "RARE", "EPIC", "LEGENDARY"];

    if (!validRarities.includes(draft.rarity)) {
      return {
        success: false,
        error: "Achievement rarity is invalid.",
        achievementId: null,
      };
    }

    if (!isSupportedTrigger(draft.triggerType)) {
      return {
        success: false,
        error: "Achievement trigger is not supported.",
        achievementId: null,
      };
    }

    if (!validateTriggerConfig(draft)) {
      return {
        success: false,
        error: "Achievement trigger configuration is invalid.",
        achievementId: null,
      };
    }

    // Make sure the selected pack actually exists.
    const { data: pack, error: packError } = await supabaseAdmin
      .from("achievement_packs")
      .select("id")
      .eq("id", packId)
      .maybeSingle();

    if (packError || !pack) {
      return {
        success: false,
        error: "Achievement pack does not exist.",
        achievementId: null,
      };
    }

    // Avoid saving a duplicate title
    const { data: existingAchievement } = await supabaseAdmin
      .from("achievements")
      .select("id")
      .ilike("title", draft.title.trim())
      .maybeSingle();

    if (existingAchievement) {
      return {
        success: false,
        error: "An achievement with this title already exists.",
        achievementId: null,
      };
    }

    const { data: achievement, error: insertError } = await supabaseAdmin
      .from("achievements")
      .insert({
        title: draft.title.trim(),
        description: draft.description.trim(),
        type: draft.rarity,
        emoji: draft.emoji,
        pack_id: packId,

        status: "draft",
        generated_by: "ai",

        trigger_type: draft.triggerType,
        trigger_config: draft.triggerConfig,

        icon_concept: draft.iconConcept.trim(),
        image_prompt: draft.imagePrompt.trim(),

        icon_path: null,

        // Only daily_claim achievements belong in the
        // normal daily achievement mechanism.
        is_daily: draft.triggerType === "daily_claim",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving generated achievement draft:", insertError);

      return {
        success: false,
        error: "Unable to save achievement draft.",
        achievementId: null,
      };
    }

    return {
      success: true,
      error: null,
      achievementId: achievement.id,
    };
  } catch (error) {
    console.error("Save achievement draft error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save achievement draft.",
      achievementId: null,
    };
  }
}
