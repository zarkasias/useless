import "server-only";

import Stripe from "stripe";
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

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
) {
  console.log("[subscription sync]", {
    subscriptionId: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    metadata: subscription.metadata,
  });
  const userId = subscription.metadata.user_id;

  if (!userId) {
    console.error(
      "Stripe subscription is missing user_id metadata:",
      subscription.id,
    );

    return;
  }

  const subscriptionItem = subscription.items.data[0];

  const price = subscriptionItem?.price;

  const billingInterval = price?.recurring?.interval ?? null;

  const currentPeriodStart = subscriptionItem?.current_period_start
    ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
    : null;

  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
    : null;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  console.log("[subscription sync] upserting", {
    userId,
    subscriptionId: subscription.id,
    customerId,
    priceId: price?.id,
    billingInterval,
    status: subscription.status,
  });

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "stripe",
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      provider_price_id: price?.id ?? null,
      status: subscription.status,
      billing_interval: billingInterval,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Error syncing Stripe subscription:", error);

    throw new Error("Unable to sync subscription.");
  }
}

export async function markStripeSubscriptionCanceled(
  subscription: Stripe.Subscription,
) {
  const subscriptionItem = subscription.items.data[0];
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      current_period_end: subscriptionItem.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_subscription_id", subscription.id);

  if (error) {
    console.error("Error marking Stripe subscription canceled:", error);

    throw new Error("Unable to update canceled subscription.");
  }
}
