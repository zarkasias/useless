"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe-server";
import { getAuthenticatedUser } from "@/lib/services/achievement-service-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type BillingInterval = "month" | "year";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

function getPriceId(interval: BillingInterval) {
  if (interval === "month") {
    return process.env.STRIPE_PRICE_MONTHLY;
  }

  return process.env.STRIPE_PRICE_YEARLY;
}

export async function createCustomerPortalAction(returnPath = "/pro") {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading subscription customer:", error);

    throw new Error("Unable to load subscription");
  }

  if (!subscription?.provider_customer_id) {
    throw new Error("No Stripe customer found for this account.");
  }
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.provider_customer_id,

    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}${returnPath}`,
  });

  redirect(portalSession.url);
}

export async function changeSubscriptionPlanAction(interval: BillingInterval) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const priceId = getPriceId(interval);

  if (!priceId) {
    throw new Error(`Missing Stripe price for billing interval: ${interval}`);
  }

  const { data: subscriptionRecord, error: subscriptionError } =
    await supabaseAdmin
      .from("subscriptions")
      .select(
        `
    provider_subscription_id,
    provider_price_id,
    status
    `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (subscriptionError) {
    console.error("Error loading subscription", subscriptionError);

    throw new Error("Unable to load subscription.");
  }

  if (!subscriptionRecord?.provider_subscription_id) {
    throw new Error("No active Stripe subscription found.");
  }

  if (subscriptionRecord.provider_price_id === priceId) {
    return {
      changed: false,
      interval,
    };
  }

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionRecord.provider_subscription_id,
  );

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error("Stripe subscription has no subscription item.");
  }

  await stripe.subscriptions.update(subscription.id, {
    items: [
      {
        id: subscriptionItem.id,
        price: priceId,
      },
    ],

    metadata: {
      ...subscription.metadata,
      user_id: user.id,
      billing_interval: interval,
    },

    proration_behavior: "create_prorations",
  });

  return {
    changed: true,
    interval,
  };
}

export async function createSubscriptionCheckoutAction(
  interval: BillingInterval,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const priceId = getPriceId(interval);

  if (!priceId) {
    throw new Error(`Missing Stripe price for billing interval: ${interval}`);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",

    payment_method_types: ["card"],

    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    customer_email: user.email,

    metadata: {
      user_id: user.id,
      billing_interval: interval,
    },

    subscription_data: {
      metadata: {
        user_id: user.id,
        billing_interval: interval,
      },
    },

    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pro?checkout=cancelled`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe checkout did not return a checkout URL");
  }

  redirect(checkoutSession.url);
}
