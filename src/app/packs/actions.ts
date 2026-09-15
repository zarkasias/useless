"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

import { createClient as createAdminClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function createPackCheckoutAction(formData: FormData) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const packId = String(formData.get("packId") ?? "").trim();

  if (!packId) {
    throw new Error("Pack id is required.");
  }

  const { data: pack, error } = await supabaseAdmin
    .from("achievement_packs")
    .select(
      `
        id,
        name,
        slug,
        stripe_price_id,
        status,
        starts_at,
        ends_at
    `,
    )
    .eq("id", packId)
    .single();

  if (error || !pack) {
    throw new Error("Achievement pack not found.");
  }

  if (pack.status !== "active") {
    throw new Error("This achievement pack is not currently available.");
  }

  if (!pack.stripe_price_id) {
    throw new Error("This achievement pack does not have a Stripe price.");
  }

  const now = Date.now();

  if (pack.starts_at && now < new Date(pack.starts_at).getTime()) {
    throw new Error("This achievement pack is not available yet.");
  }

  if (pack.ends_at && now > new Date(pack.ends_at).getTime()) {
    throw new Error("This achievement pack is no longer available.");
  }

  // Don't allow purchase if already owned.
  const { data: ownership } = await supabaseAdmin
    .from("user_achievement_packs")
    .select("id")
    .eq("user_id", user.id)
    .eq("pack_id", pack.id)
    .eq("purchase_status", "owned")
    .maybeSingle();

  if (ownership) {
    redirect(`/packs/${pack.slug}`);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    payment_method_types: ["card"],

    line_items: [
      {
        price: pack.stripe_price_id,
        quantity: 1,
      },
    ],

    customer_email: user.email ?? undefined,

    metadata: {
      userId: user.id,
      packId: pack.id,
      packSlug: pack.slug,
    },

    success_url: `${origin}/packs/${pack.slug}?purchase=success`,

    cancel_url: `${origin}/packs?purchase=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(session.url);
}
