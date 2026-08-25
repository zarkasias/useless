import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe-server";

import {
  syncStripeSubscription,
  markStripeSubscriptionCanceled,
} from "@/lib/services/subscription-service-server";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");

    return NextResponse.json(
      {
        error: "Stripe webhook is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      {
        error: "Invalid webhook signature.",
      },
      {
        status: 400,
      },
    );
  }

  console.log("Stripe webhook received:", event.type);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      await syncStripeSubscription(subscription);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      await markStripeSubscriptionCanceled(subscription);

      break;
    }

    default:
      break;
  }

  return NextResponse.json({
    received: true,
  });
}
