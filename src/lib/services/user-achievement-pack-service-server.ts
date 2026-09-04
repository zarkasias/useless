import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export interface UserAchievementPack {
  id: string;
  user_id: string;
  pack_id: string;
  purchase_status: "owned" | "refunded" | "revoked";
  purchased_at: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function userOwnsAchievementPack(
  userId: string,
  packId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_achievement_packs")
    .select("id")
    .eq("user_id", userId)
    .eq("pack_id", packId)
    .eq("purchase_status", "owned")
    .maybeSingle();

  if (error) {
    console.error("Error checking achievement pack ownership:", error);

    throw new Error("Unable to check achievement pack ownership.");
  }

  return Boolean(data);
}

export async function getUserOwnedAchievementPacks(
  userId: string,
): Promise<UserAchievementPack[]> {
  const { data, error } = await supabaseAdmin
    .from("user_achievement_packs")
    .select("*")
    .eq("user_id", userId)
    .eq("purchase_status", "owned")
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("Error loading owned achievement packs:", error);

    throw new Error("Unable to load owned achievement packs.");
  }

  return (data ?? []) as UserAchievementPack[];
}

export interface PackToUserProps {
  userId: string;
  packId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
}

export async function grantAchievementPackToUser({
  userId,
  packId,
  stripeCheckoutSessionId,
  stripePaymentIntentId,
  stripeCustomerId,
}: PackToUserProps): Promise<UserAchievementPack> {
  const { data, error } = await supabaseAdmin
    .from("user_achievement_packs")
    .upsert(
      {
        user_id: userId,
        pack_id: packId,
        purchase_status: "owned",
        purchased_at: new Date().toISOString(),
        stripe_checkout_session_id: stripeCheckoutSessionId ?? null,
        stripe_payment_intent_id: stripePaymentIntentId ?? null,
        stripe_customer_id: stripeCustomerId ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,pack_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    console.error("Error granting achievement pack:", error);

    throw new Error("Unable to grant achievement pack.");
  }

  return data as UserAchievementPack;
}
